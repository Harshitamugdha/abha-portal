import type { RecordType } from "@/contracts/shared";

export type ConsentFormValues = {
  patientId: string;
  scopes: RecordType[];
  purpose: string;
  durationDays: number | string;
  institutionId?: string;
};

/**
 * Pure helper constructing a ConsentRequest payload from raw form values.
 * Trims purpose, parses durationDays as integer, and preserves optional institutionId only if non-empty.
 */
export function buildConsentRequest(values: ConsentFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    patientId: values.patientId,
    scopes: values.scopes,
    purpose: typeof values.purpose === "string" ? values.purpose.trim() : values.purpose,
    durationDays:
      typeof values.durationDays === "string"
        ? parseInt(values.durationDays, 10)
        : values.durationDays,
  };

  if (values.institutionId && typeof values.institutionId === "string" && values.institutionId.trim() !== "") {
    payload.institutionId = values.institutionId.trim();
  }

  return payload;
}
