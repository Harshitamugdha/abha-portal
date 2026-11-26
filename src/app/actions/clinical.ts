"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  EncounterCreate,
  LabOrderCreate,
  PrescriptionCreate,
} from "@/contracts/clinical";
import type { LabOrderDTO } from "@/contracts/lab";
import type { RecordDTO } from "@/contracts/records";
import type { ActionResult } from "@/contracts/shared";
import { requireSession } from "@/server/auth/session";
import { writeEncounter } from "@/server/clinical/encounter";
import { writeLabOrder } from "@/server/clinical/lab-order";
import {
  writePrescription,
  type WritePrescriptionResult,
} from "@/server/clinical/prescription";
import { actionError, handleActionError } from "@/server/http";
import { parseIstDate } from "@/server/records/params";

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

/**
 * Server Action for doctors to create lab orders.
 *
 * Sequence:
 * 1. requireSession()
 * 2. Zod validation with LabOrderCreate schema
 * 3. writeLabOrder() validates lab institution type, trims tests, authorizes, and creates order
 * 4. Cache revalidation
 */
export async function createLabOrder(
  input: unknown,
): Promise<ActionResult<LabOrderDTO>> {
  try {
    const user = await requireSession();
    const parsed = LabOrderCreate.safeParse(input);

    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }

    const result = await writeLabOrder(user, parsed.data);

    revalidatePath("/doctor/patients");
    revalidatePath(`/doctor/patients/${parsed.data.patientId}`);
    revalidatePath("/lab");

    return { ok: true, data: result };
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Server Action for doctors to record a clinical encounter visit.
 *
 * Sequence:
 * 1. requireSession()
 * 2. Convert IST date input to UTC ISO format and validate with EncounterCreate
 * 3. writeEncounter() checks authorization, assigns institution, and saves HealthRecord
 * 4. Cache revalidation on doctor and patient records
 */
export async function createEncounter(
  input: unknown,
): Promise<ActionResult<RecordDTO>> {
  try {
    const user = await requireSession();

    let candidate = input;
    if (candidate && typeof candidate === "object" && "occurredAt" in candidate) {
      const rawDate = String((candidate as { occurredAt: unknown }).occurredAt || "");
      if (rawDate && !rawDate.endsWith("Z")) {
        candidate = {
          ...candidate,
          occurredAt: parseIstDate(rawDate),
        };
      }
    }

    const parsed = EncounterCreate.safeParse(candidate);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }

    const result = await writeEncounter(user, parsed.data);

    revalidatePath("/doctor/patients");
    revalidatePath(`/doctor/patients/${parsed.data.patientId}`);
    revalidatePath("/patient/records");
    revalidatePath("/patient");

    return { ok: true, data: result };
  } catch (error) {
    return handleActionError(error);
  }
}
