"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/contracts/shared";
import { actionError } from "@/server/http";
import { LanguageSchema, type Language } from "@/server/i18n";

export async function setLanguage(input: unknown): Promise<ActionResult<{ lang: Language }>> {
  try {
    let raw: unknown = input;
    if (input instanceof FormData) {
      raw = input.get("lang");
    } else if (typeof input === "object" && input !== null && "lang" in input) {
      raw = (input as { lang: unknown }).lang;
    }

    const parsed = LanguageSchema.safeParse(raw);
    if (!parsed.success) {
      return actionError("VALIDATION_FAILED", "Language must be 'en' or 'hi'", z.flattenError(parsed.error));
    }

    const cookieStore = await cookies();
    cookieStore.set("lang", parsed.data, {
      path: "/",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year (preference, not a token)
    });

    revalidatePath("/", "layout");
    return { ok: true, data: { lang: parsed.data } };
  } catch (error) {
    return actionError("INTERNAL", error instanceof Error ? error.message : "Failed to set language");
  }
}
