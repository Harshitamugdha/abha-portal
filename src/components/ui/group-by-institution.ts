import type { RecordDTO } from "@/contracts/records";

export type InstitutionGroupData = {
  institutionId: string;
  institutionName: string;
  records: RecordDTO[];
};

export function groupRecordsByInstitution(records: RecordDTO[]): InstitutionGroupData[] {
  const map = new Map<string, InstitutionGroupData>();

  for (const record of records) {
    let group = map.get(record.institutionId);
    if (!group) {
      group = {
        institutionId: record.institutionId,
        institutionName: record.institutionName,
        records: [],
      };
      map.set(record.institutionId, group);
    }
    group.records.push(record);
  }

  const result: InstitutionGroupData[] = [];
  for (const group of map.values()) {
    // Sort records newest to oldest within each institution
    group.records.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    result.push(group);
  }

  // Sort institutions alphabetically by name
  result.sort((a, b) => a.institutionName.localeCompare(b.institutionName));

  return result;
}
