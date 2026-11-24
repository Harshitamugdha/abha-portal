"use server";

import { revalidatePath } from "next/cache";
import {
  InstitutionCreate,
  InstitutionUpdate,
  VerifyStaffInput,
  type InstitutionDTO,
  type StaffDTO,
} from "@/contracts/admin";
import type { ActionResult } from "@/contracts/shared";
import {
  createInstitution as createInst,
  updateInstitution as updateInst,
  verifyStaff as verify,
} from "@/server/admin/admin";
import { requireSession } from "@/server/auth/session";
import { actionError, handleActionError } from "@/server/http";

export async function verifyStaff(input: unknown): Promise<ActionResult<StaffDTO>> {
  try {
    const user = await requireSession();
    const parsed = VerifyStaffInput.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, parsed.error.flatten());
    }
    const staff = await verify(user, parsed.data.userId);
    revalidatePath("/admin/staff");
    return { ok: true, data: staff };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createInstitution(input: unknown): Promise<ActionResult<InstitutionDTO>> {
  try {
    const user = await requireSession();
    const parsed = InstitutionCreate.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, parsed.error.flatten());
    }
    const inst = await createInst(user, parsed.data);
    revalidatePath("/admin/institutions");
    return { ok: true, data: inst };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateInstitution(input: unknown): Promise<ActionResult<InstitutionDTO>> {
  try {
    const user = await requireSession();
    const parsed = InstitutionUpdate.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, parsed.error.flatten());
    }
    const inst = await updateInst(user, parsed.data);
    revalidatePath("/admin/institutions");
    return { ok: true, data: inst };
  } catch (error) {
    return handleActionError(error);
  }
}
