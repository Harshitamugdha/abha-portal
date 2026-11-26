"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PrescriptionCreate } from "@/contracts/clinical";
import type { ActionResult } from "@/contracts/shared";
import { requireSession } from "@/server/auth/session";
import {
  writePrescription,
  type WritePrescriptionResult,
} from "@/server/clinical/prescription";
import { actionError, handleActionError } from "@/server/http";

/**
 * Server Action for doctors to create prescriptions with an active share code.
 *
 * Sequence:
 * 1. requireSession() to guarantee authenticated context
 * 2. Zod validation with PrescriptionCreate schema
 * 3. writePrescription() handles clinical authorization, institution check, and atomic transaction with retry
 * 4. Cache revalidation on doctor and patient routes
 */
export async function createPrescription(
  input: unknown,
): Promise<ActionResult<WritePrescriptionResult>> {
  try {
    const user = await requireSession();
    const parsed = PrescriptionCreate.safeParse(input);

    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }

    const result = await writePrescription(user, parsed.data);

    revalidatePath("/doctor/patients");
    revalidatePath(`/doctor/patients/${parsed.data.patientId}`);
    revalidatePath("/patient/records");
    revalidatePath("/patient");

    return { ok: true, data: result };
  } catch (error) {
    return handleActionError(error);
  }
}
