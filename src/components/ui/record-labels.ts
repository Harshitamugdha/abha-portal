import type { RecordType } from "@/contracts/shared";

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  ENCOUNTER: "Visits",
  PRESCRIPTION: "Prescriptions",
  LAB_REPORT: "Lab reports",
  DOCUMENT: "Documents",
};
