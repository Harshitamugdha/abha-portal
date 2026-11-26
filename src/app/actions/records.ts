"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DocumentUpload, type RecordDTO } from "@/contracts/records";
import type { ActionResult } from "@/contracts/shared";
import { requireSession } from "@/server/auth/session";
import { actionError, handleActionError } from "@/server/http";
import { detectMime, MAX_FILE_SIZE } from "@/server/records/storage";
import { parseIstDate } from "@/server/records/params";
import { createDocumentRecord } from "@/server/records/upload";

export async function uploadDocument(
  prevStateOrFormData: unknown,
  formDataParam?: FormData,
): Promise<ActionResult<RecordDTO>> {
  try {
    const user = await requireSession();
    const formData = formDataParam instanceof FormData ? formDataParam : (prevStateOrFormData as FormData);

    if (!(formData instanceof FormData)) {
      return actionError("VALIDATION_FAILED", "Invalid form data submission.");
    }

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

    const rawDate = String(formData.get("occurredAt") || formData.get("date") || "");
    const title = String(formData.get("title") || "").trim();
    const institutionId = String(formData.get("institutionId") || "").trim();

    const parsed = DocumentUpload.safeParse({
      title,
      occurredAt: parseIstDate(rawDate),
      institutionId,
    });

    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", "Invalid document details.", z.flattenError(parsed.error));
    }

    const record = await createDocumentRecord(user, {
      upload: parsed.data,
      buffer,
      mimeType,
    });

    revalidatePath("/patient/records");
    revalidatePath("/patient");

    return { ok: true, data: record };
  } catch (error) {
    return handleActionError(error);
  }
}
