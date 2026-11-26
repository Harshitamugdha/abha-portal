import type { RecordDTO } from "@/contracts/records";

/**
 * Pure helper deciding whether a health record can display a file viewer button.
 * Records without a valid, non-empty fileId show no file button.
 */
export function canViewFile(record: Partial<RecordDTO> | null | undefined): boolean {
  if (!record || !record.fileId) {
    return false;
  }
  return typeof record.fileId === "string" && record.fileId.trim() !== "";
}
