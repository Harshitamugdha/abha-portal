"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LabResultUpload } from "@/contracts/lab";
import type { RecordDTO } from "@/contracts/records";
import type { ActionResult } from "@/contracts/shared";
import { requireSession } from "@/server/auth/session";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { actionError, handleActionError } from "@/server/http";
import { detectMime, MAX_FILE_SIZE } from "@/server/records/storage";
import { uploadLabResultRecord } from "@/server/lab/upload";

export async function uploadLabResult(
  prevStateOrFormData: unknown,
  formDataParam?: FormData,
): Promise<ActionResult<RecordDTO>> {
  try {
    // 1. requireSession
    const user = await requireSession();

    const formData =
      formDataParam instanceof FormData
        ? formDataParam
        : prevStateOrFormData instanceof FormData
          ? prevStateOrFormData
          : null;

    if (!formData) {
      return actionError("VALIDATION_FAILED", "Invalid form data submission: expected FormData.");
    }

    const rawOrderId = String(formData.get("orderId") || "").trim();
    const rawSummary = String(formData.get("summary") || "").trim();

    // 2. Zod LabResultUpload
    const parsed = LabResultUpload.safeParse({
      orderId: rawOrderId || undefined,
      summary: rawSummary,
    });

    if (!parsed.success || !parsed.data.orderId) {
      return actionError(
        "VALIDATION_FAILED",
        "Invalid lab result upload details.",
        parsed.success ? undefined : z.flattenError(parsed.error),
      );
    }

    const orderId = parsed.data.orderId;
    const summary = parsed.data.summary;

    // 3. Load the order
    const order = await db.labOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      return actionError("NOT_FOUND", "Lab order not found.");
    }

    // 4. Authorize labResult:upload with kind labOrder (another lab's order gives NOT_FOUND)
    const decision = await authorize(user, "labResult:upload", {
      kind: "labOrder",
      order,
    });
    if (!decision.allowed) {
      return actionError(decision.code, "Not authorized to upload result for this order.");
    }

    // 5. Order must be PENDING else CONFLICT
    if (order.status !== "PENDING") {
      return actionError("CONFLICT", "This lab order has already been completed.");
    }

    // 6. File checks reused from P2.1 (5 MB, type from bytes)
    const file = formData.get("file");
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return actionError("VALIDATION_FAILED", "Please select a file to upload.");
    }

    if (file.size > MAX_FILE_SIZE) {
      return actionError("FILE_TOO_LARGE", "The file is larger than 5 MB.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_FILE_SIZE) {
      return actionError("FILE_TOO_LARGE", "The file is larger than 5 MB.");
    }

    const mimeType = detectMime(buffer);
    if (!mimeType) {
      return actionError("VALIDATION_FAILED", "Only PDF, PNG, or JPEG files are allowed.");
    }

    // 7. Transaction
    const record = await uploadLabResultRecord(user, {
      orderId,
      summary,
      buffer,
      mimeType,
      order,
    });

    revalidatePath("/lab");
    revalidatePath(`/lab/orders/${orderId}`);
    revalidatePath("/patient/records");
    revalidatePath("/patient");

    return { ok: true, data: record };
  } catch (error) {
    return handleActionError(error);
  }
}
