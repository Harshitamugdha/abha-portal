import { cookies } from "next/headers";
import { z } from "zod";
import enMessages from "../../messages/en.json";
import hiMessages from "../../messages/hi.json";

export const LanguageSchema = z.enum(["en", "hi"]);
export type Language = z.infer<typeof LanguageSchema>;
export type Messages = typeof enMessages;

export const DEFAULT_LANGUAGE: Language = "en";
export const SUPPORTED_LANGUAGES: Language[] = ["en", "hi"];

export function resolveLanguage(val?: string | null): Language {
  if (val === "hi") {
    return "hi";
  }
  return "en";
}

export async function getLanguage(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("lang")?.value;
    return resolveLanguage(raw);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export async function getMessages(langOverride?: string | null): Promise<Messages> {
  const lang = langOverride !== undefined ? resolveLanguage(langOverride) : await getLanguage();
  return lang === "hi" ? hiMessages : enMessages;
}
