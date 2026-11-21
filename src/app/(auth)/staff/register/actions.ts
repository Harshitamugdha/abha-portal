"use server";

import { z } from "zod";
import { StaffRegisterRequest } from "@/contracts/auth";
import type { ActionResult } from "@/contracts/shared";
import { createStaffAccount } from "@/server/auth/register";
import { actionError, handleActionError } from "@/server/http";

export async function registerStaff(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = StaffRegisterRequest.safeParse(input);
  if (!parsed.success) {
    return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
  }

  try {
    const result = await createStaffAccount(parsed.data);
    return { ok: true, data: result };
  } catch (error) {
    return handleActionError(error);
  }
}
