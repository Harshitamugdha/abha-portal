import "server-only";
import type { DocumentUpload, RecordDTO } from "@/contracts/records";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { recordSelect, toRecordDTO } from "./list";
import * as storage from "./storage";

export type CreateDocumentInput = {
  upload: DocumentUpload;
  buffer: Buffer;
  mimeType: storage.AllowedMimeType;
};

export async function createDocumentRecord(
  user: SessionUser,
  input: CreateDocumentInput,
): Promise<RecordDTO> {
  const decision = await authorize(user, "record:create:self", {
    kind: "patient",
    patientId: user.id,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  const key = await storage.put(input.buffer, input.mimeType);

  const row = await db.$transaction(async (tx) => {
    const fileObject = await tx.fileObject.create({
      data: {
        key,
        mimeType: input.mimeType,
        sizeBytes: input.buffer.length,
        uploadedBy: user.id,
      },
    });

    return tx.healthRecord.create({
      data: {
        patientId: user.id,
        institutionId: input.upload.institutionId,
        authorId: null,
        type: "DOCUMENT",
        title: input.upload.title,
        occurredAt: new Date(input.upload.occurredAt),
        fileId: fileObject.id,
      },
      select: recordSelect,
    });
  });

  return toRecordDTO(row);
}
