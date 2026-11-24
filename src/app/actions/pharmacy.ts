"use server";

import { revalidatePath } from "next/cache";
import { DispensePrescriptionInput, type PharmacyPrescriptionDTO } from "@/contracts/pharmacy";
import type { ActionResult } from "@/contracts/shared";
import { requireSession } from "@/server/auth/session";
import { actionError, handleActionError } from "@/server/http";
import { dispensePrescription as dispense } from "@/server/pharmacy/pharmacy";

export async function dispensePrescription(input: unknown): Promise<ActionResult<PharmacyPrescriptionDTO>> {
  try {
    const user = await requireSession();
    const parsed = DispensePrescriptionInput.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, parsed.error.flatten());
    }
    const result = await dispense(user, parsed.data.recordId);
    revalidatePath("/pharmacy");
    return { ok: true, data: result };
  } catch (error) {
    return handleActionError(error);
  }
}
