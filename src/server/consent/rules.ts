import type { ConsentDisplayStatus, ConsentStatus, RecordType } from "@/contracts/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

export function narrowScopes(requested: RecordType[], submitted: RecordType[]): RecordType[] {
  const approved: RecordType[] = [];
  for (const scope of requested) {
    if (submitted.includes(scope)) {
      approved.push(scope);
    }
  }
  return approved;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function displayStatus(status: ConsentStatus, validTo: Date | null, now: Date): ConsentDisplayStatus {
  if (status === "GRANTED" && validTo && now >= validTo) {
    return "EXPIRED";
  }
  return status;
}

export function chooseInstitution(doctorInstitutionIds: string[], requestedId?: string): string | null {
  if (requestedId) {
    if (doctorInstitutionIds.includes(requestedId)) {
      return requestedId;
    }
    return null;
  }
  if (doctorInstitutionIds.length === 1) {
    return doctorInstitutionIds[0];
  }
  return null;
}
