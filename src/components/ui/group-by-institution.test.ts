import { describe, expect, it } from "vitest";
import type { RecordDTO } from "@/contracts/records";
import { groupRecordsByInstitution } from "./group-by-institution";

describe("groupRecordsByInstitution helper", () => {
  const records: RecordDTO[] = [
    {
      id: "rec-1",
      patientId: "user-asha",
      institutionId: "inst-sunrise",
      institutionName: "Sunrise Multispeciality",
      authorId: "user-arjun",
      authorName: "Dr Arjun Mehta",
      type: "DOCUMENT",
      title: "Discharge Summary",
      summary: null,
      occurredAt: "2026-09-15T10:00:00.000Z",
      fileId: null,
      createdAt: "2026-09-15T10:00:00.000Z",
    },
    {
      id: "rec-2",
      patientId: "user-asha",
      institutionId: "inst-citygen",
      institutionName: "City General Hospital",
      authorId: "user-kavya",
      authorName: "Dr Kavya Iyer",
      type: "LAB_REPORT",
      title: "CBC",
      summary: null,
      occurredAt: "2026-10-21T09:30:00.000Z",
      fileId: null,
      createdAt: "2026-10-21T09:30:00.000Z",
    },
    {
      id: "rec-3",
      patientId: "user-asha",
      institutionId: "inst-citygen",
      institutionName: "City General Hospital",
      authorId: "user-kavya",
      authorName: "Dr Kavya Iyer",
      type: "PRESCRIPTION",
      title: "BP Medication",
      summary: null,
      occurredAt: "2026-10-20T11:00:00.000Z",
      fileId: null,
      createdAt: "2026-10-20T11:00:00.000Z",
    },
  ];

  it("groups records by institution and sorts institutions alphabetically", () => {
    const groups = groupRecordsByInstitution(records);

    expect(groups).toHaveLength(2);
    // City General comes before Sunrise alphabetically
    expect(groups[0].institutionName).toBe("City General Hospital");
    expect(groups[0].records).toHaveLength(2);

    expect(groups[1].institutionName).toBe("Sunrise Multispeciality");
    expect(groups[1].records).toHaveLength(1);
  });

  it("sorts records within each institution group newest to oldest", () => {
    const groups = groupRecordsByInstitution(records);
    const cityGenRecords = groups[0].records;

    expect(cityGenRecords[0].id).toBe("rec-2"); // Oct 21
    expect(cityGenRecords[1].id).toBe("rec-3"); // Oct 20
  });

  it("returns an empty array when given no records", () => {
    expect(groupRecordsByInstitution([])).toEqual([]);
  });
});
