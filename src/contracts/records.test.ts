import { describe, expect, it } from "vitest";
import { DocumentUpload, RecordDTO, RecordListQuery } from "./records";

describe("RecordDTO", () => {
  const validRecord = {
    id: "rec-asha-cbc",
    patientId: "user-asha",
    institutionId: "inst-citygen",
    institutionName: "City General Hospital",
    authorId: "user-kavya",
    authorName: "Dr Kavya Iyer",
    type: "LAB_REPORT" as const,
    title: "Complete Blood Count",
    summary: "Normal hemoglobin and platelets",
    occurredAt: "2026-10-21T09:30:00.000Z",
    fileId: "file-1",
    createdAt: "2026-10-21T09:30:00.000Z",
    prescription: null,
  };

  it("accepts a valid health record DTO", () => {
    expect(RecordDTO.safeParse(validRecord).success).toBe(true);
  });

  it("accepts a prescription record with prescription detail", () => {
    const rxRecord = {
      ...validRecord,
      id: "rec-asha-rx",
      type: "PRESCRIPTION" as const,
      title: "Hypertension medication",
      prescription: {
        items: [
          {
            drug: "Amlodipine",
            dose: "5 mg",
            frequency: "Once daily",
            durationDays: 30,
            notes: "Take in the morning",
          },
        ],
        shareCode: "ASHA7K",
        dispensedAt: null,
        expiresAt: "2026-11-20T09:30:00.000Z",
      },
    };
    expect(RecordDTO.safeParse(rxRecord).success).toBe(true);
  });

  it("rejects a record missing required fields", () => {
    expect(RecordDTO.safeParse({ ...validRecord, title: "" }).success).toBe(false);
    expect(RecordDTO.safeParse({ ...validRecord, type: "UNKNOWN" }).success).toBe(false);
  });
});

describe("RecordListQuery", () => {
  it("accepts a valid query and defaults page numbers", () => {
    const parsed = RecordListQuery.parse({ patientId: "user-asha" });
    expect(parsed).toEqual({
      patientId: "user-asha",
      page: 1,
      pageSize: 20,
    });
  });

  it("accepts filters for type and date range", () => {
    const query = {
      patientId: "user-asha",
      type: "ENCOUNTER",
      institutionId: "inst-citygen",
      from: "2026-10-01T00:00:00.000Z",
      to: "2026-10-31T23:59:59.000Z",
      page: "2",
      pageSize: "10",
    };
    const parsed = RecordListQuery.parse(query);
    expect(parsed.type).toBe("ENCOUNTER");
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(10);
  });

  it("rejects an empty patientId", () => {
    expect(RecordListQuery.safeParse({ patientId: "" }).success).toBe(false);
  });
});

describe("DocumentUpload", () => {
  it("accepts a valid document upload input", () => {
    const input = {
      title: "Discharge Summary",
      occurredAt: "2026-10-15T10:00:00.000Z",
      institutionId: "inst-citygen",
    };
    expect(DocumentUpload.safeParse(input).success).toBe(true);
  });

  it("rejects missing title or invalid date", () => {
    expect(
      DocumentUpload.safeParse({
        title: "   ",
        occurredAt: "2026-10-15T10:00:00.000Z",
        institutionId: "inst-citygen",
      }).success
    ).toBe(false);

    expect(
      DocumentUpload.safeParse({
        title: "Summary",
        occurredAt: "not-a-date",
        institutionId: "inst-citygen",
      }).success
    ).toBe(false);
  });
});
