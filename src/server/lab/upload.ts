import "server-only";
import fs from "node:fs";
import type { LabOrder } from "@/generated/prisma/client";
import type { RecordDTO } from "@/contracts/records";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { recordSelect, toRecordDTO } from "@/server/records/list";
import * as storage from "@/server/records/storage";

export type UploadLabResultInput = {
  orderId: string;
  summary: string;
  buffer: Buffer;
  mimeType: storage.AllowedMimeType;
  order?: LabOrder;
};

export async function uploadLabResultRecord(
  user: SessionUser,
  input: UploadLabResultInput,
): Promise<RecordDTO> {
  const order =
    input.order ??
    (await db.labOrder.findUnique({
      where: { id: input.orderId },
    }));

  if (!order) {
    throw new ApiError("NOT_FOUND", "Lab order not found.");
  }

  const decision = await authorize(user, "labResult:upload", {
    kind: "labOrder",
    order,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code, "Not authorized to upload result for this order.");
  }

  if (order.status !== "PENDING") {
    throw new ApiError("CONFLICT", "This lab order has already been completed.");
  }

  const key = await storage.put(input.buffer, input.mimeType);

  try {
    const row = await db.$transaction(async (tx) => {
      const updated = await tx.labOrder.updateMany({
        where: {
          id: order.id,
          status: "PENDING",
        },
        data: {
          status: "COMPLETED",
        },
      });

      if (updated.count === 0) {
        throw new ApiError("CONFLICT", "This lab order has already been completed.");
      }

      const fileObject = await tx.fileObject.create({
        data: {
          key,
          mimeType: input.mimeType,
          sizeBytes: input.buffer.length,
          uploadedBy: user.id,
        },
      });

      const record = await tx.healthRecord.create({
        data: {
          patientId: order.patientId,
          institutionId: order.labInstitutionId,
          authorId: user.id,
          type: "LAB_REPORT",
          title: `Lab report: ${order.tests.join(", ")}`.slice(0, 200),
          summary: input.summary,
          occurredAt: new Date(),
          fileId: fileObject.id,
        },
        select: recordSelect,
      });

      await tx.labOrder.update({
        where: { id: order.id },
        data: {
          resultRecordId: record.id,
        },
      });

      return record;
    });

    return toRecordDTO(row);
  } catch (error) {
    if (typeof storage.getFilePath === "function") {
      try {
        const filePath = storage.getFilePath(key);
        await fs.promises.unlink(filePath);
      } catch {
        // ignore
      }
    }
    throw error;
  }
}
