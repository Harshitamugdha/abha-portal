"use server";

import { z } from "zod";
import { StaffRegisterRequest } from "@/contracts/auth";
import type { ActionResult } from "@/contracts/shared";
import { createStaffAccount } from "@/server/auth/register";
import { actionError, handleActionError } from "@/server/http";

// Server Action: registerStaff (CONTRACTS §4.1). The /staff/register form (Phase 5) calls this.
//
// This is the ONE Server Action that doesn't start with requireSession() + authorize() (rule 3):
// the person registering has no account yet. Its guards are the Zod check here and the
// role/institution checks in createStaffAccount. The account it creates is unverified, so it
// grants no access until an admin verifies it.
export async function registerStaff(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = StaffRegisterRequest.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
  }

  try {
    const result = await createStaffAccount(parsed.data);
    return { ok: true, data: result };
  } catch (error) {
    return handleActionError(error); // CONFLICT, VALIDATION_FAILED, or INTERNAL
  }
}
