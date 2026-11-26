import { describe, expect, it } from "vitest";
import type { RecordDTO } from "@/contracts/records";
import { getMonthYearIST, groupRecordsByMonth } from "./group-by-month";

describe("group-by-month helper", () => {
  it("belongs to October in IST for boundary case at 2026-09-30T20:00:00Z", () => {
    // 20:00 UTC + 5:30 IST = 01:30 AM next day (Oct 1)
    const result = getMonthYearIST("2026-09-30T20:00:00Z");
    expect(result.monthName).toBe("October");
    expect(result.year).toBe(2026);
    expect(result.label).toBe("October 2026");
    expect(result.key).toBe("2026-10");
  });

  it("belongs to September in IST before the midnight rollover", () => {
    // 18:29 UTC + 5:30 IST = 23:59 on Sep 30
    const result = getMonthYearIST("2026-09-30T18:29:00Z");
    expect(result.monthName).toBe("September");
    expect(result.year).toBe(2026);
    expect(result.label).toBe("September 2026");
  });

  it("groups records into monthly sections ordered newest first", () => {
    const records: RecordDTO[] = [
      {
        id: "rec-1",
        patientId: "user-asha",
        institutionId: "inst-citygen",
        institutionName: "City General",
        authorId: null,
        authorName: null,
        type: "ENCOUNTER",
        title: "Visit 1",
        summary: null,
        occurredAt: "2026-09-15T10:00:00.000Z",
        fileId: null,
        createdAt: "2026-09-15T10:00:00.000Z",
      },
      {
        id: "rec-2",
        patientId: "user-asha",
        institutionId: "inst-citygen",
        institutionName: "City General",
        authorId: null,
        authorName: null,
        type: "PRESCRIPTION",
        title: "Prescription 1",
        summary: null,
        occurredAt: "2026-10-05T10:00:00.000Z",
        fileId: null,
        createdAt: "2026-10-05T10:00:00.000Z",
      },
      {
        id: "rec-3",
        patientId: "user-asha",
        institutionId: "inst-citygen",
        institutionName: "City General",
        authorId: null,
        authorName: null,
        type: "LAB_REPORT",
        title: "Boundary record",
        summary: null,
        occurredAt: "2026-09-30T20:00:00.000Z", // Belongs to October in IST
        fileId: null,
        createdAt: "2026-09-30T20:00:00.000Z",
      },
    ];

    const groups = groupRecordsByMonth(records);
    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe("October 2026");
    expect(groups[0].records).toHaveLength(2); // rec-2 and rec-3
    expect(groups[1].label).toBe("September 2026");
    expect(groups[1].records).toHaveLength(1); // rec-1
  });
});
