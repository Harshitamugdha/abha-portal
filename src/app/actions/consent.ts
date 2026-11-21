"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ConsentApprove, ConsentIdInput, ConsentRequest, type ConsentDTO } from "@/contracts/consent";
import type { ActionResult } from "@/contracts/shared";
import { requireSession } from "@/server/auth/session";
import { approveRequest, createRequest, denyRequest, revokeGrant } from "@/server/consent/engine";
import { actionError, handleActionError } from "@/server/http";

export async function requestConsent(input: unknown): Promise<ActionResult<ConsentDTO>> {
  try {
    const user = await requireSession();
    const parsed = ConsentRequest.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }
    const consent = await createRequest(user, parsed.data);
    revalidatePath("/patient/consents");
    return { ok: true, data: consent };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function approveConsent(input: unknown): Promise<ActionResult<ConsentDTO>> {
  try {
    const user = await requireSession();
    const parsed = ConsentApprove.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }
    const consent = await approveRequest(user, parsed.data);
    revalidatePath("/patient/consents");
    return { ok: true, data: consent };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function denyConsent(input: unknown): Promise<ActionResult<ConsentDTO>> {
  try {
    const user = await requireSession();
    const parsed = ConsentIdInput.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }
    const consent = await denyRequest(user, parsed.data.consentId);
    revalidatePath("/patient/consents");
    return { ok: true, data: consent };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function revokeConsent(input: unknown): Promise<ActionResult<ConsentDTO>> {
  try {
    const user = await requireSession();
    const parsed = ConsentIdInput.safeParse(input);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }
    const consent = await revokeGrant(user, parsed.data.consentId);
    revalidatePath("/patient/consents");
    return { ok: true, data: consent };
  } catch (error) {
    return handleActionError(error);
  }
}
