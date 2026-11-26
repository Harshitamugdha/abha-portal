import { describe, expect, it } from "vitest";
import type { RecordDTO } from "@/contracts/records";
import { groupByInstitution } from "@/components/ui/group-by-institution";
import { viewerState } from "./viewer-state";

describe("viewerState helper", () => {
  it("CONSENT_REQUIRED with no data gives consent (not empty)", () => {
    const state = viewerState({ code: "CONSENT_REQUIRED" }, null);
    expect(state).toBe("consent");
  });

  it("CONSENT_REQUIRED with empty items data still gives consent (not empty) - TRAPS §4", () => {
    const state = viewerState({ code: "CONSENT_REQUIRED" }, { items: [] });
    expect(state).toBe("consent");
  });

  it("empty items gives empty", () => {
    const state = viewerState(null, { items: [] });
    expect(state).toBe("empty");
  });

  it("any other error gives error", () => {
    expect(viewerState({ code: "FORBIDDEN" }, null)).toBe("error");
    expect(viewerState({ code: "INTERNAL" }, null)).toBe("error");
    expect(viewerState({ message: "Network Failed" }, null)).toBe("error");
  });

  it("returns records when items are present", () => {
    const state = viewerState(null, {
      items: [
        {
          id: "rec-1",
          patientId: "user-asha",
          institutionId: "inst-citygen",
          institutionName: "City General Hospital",
          authorId: "user-kavya",
          authorName: "Dr Kavya",
          type: "LAB_REPORT",
          title: "CBC",
          summary: null,
          occurredAt: "2026-10-21T09:30:00.000Z",
          fileId: null,
          createdAt: "2026-10-21T09:30:00.000Z",
        },
      ],
    });
    expect(state).toBe("records");
  });

  it("returns loading when loading is true or data and error are absent", () => {
    expect(viewerState(null, null, true)).toBe("loading");
    expect(viewerState(null, null)).toBe("loading");
  });
});

describe("groupByInstitution helper", () => {
  const records: RecordDTO[] = [
    {
      id: "rec-1",
      patientId: "user-asha",
      institutionId: "inst-sunrise",
      institutionName: "Sunrise Multispeciality",
      authorId: "user-arjun",
      authorName: "Dr Arjun",
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
      authorName: "Dr Kavya",
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
      authorName: "Dr Kavya",
      type: "PRESCRIPTION",
      title: "Medication",
      summary: null,
      occurredAt: "2026-10-20T11:00:00.000Z",
      fileId: null,
      createdAt: "2026-10-20T11:00:00.000Z",
    },
  ];

  it("groups records by institution and sorts records descending by date", () => {
    const groups = groupByInstitution(records);

    expect(groups.length).toBe(2);
    // City General Hospital first alphabetically
    expect(groups[0].institutionName).toBe("City General Hospital");
    expect(groups[0].records.length).toBe(2);
    expect(groups[0].records[0].id).toBe("rec-2"); // newer
    expect(groups[0].records[1].id).toBe("rec-3"); // older

    // Sunrise Multispeciality second
    expect(groups[1].institutionName).toBe("Sunrise Multispeciality");
    expect(groups[1].records.length).toBe(1);
  });

  it("returns empty array for empty records list", () => {
    expect(groupByInstitution([])).toEqual([]);
  });
});
