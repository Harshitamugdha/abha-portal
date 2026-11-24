import { describe, expect, it } from "vitest";
import { LabOrderDTO, LabOrderListQuery, LabResultUpload } from "./lab";

describe("LabOrderDTO", () => {
  const validOrder = {
    id: "laborder-asha-1",
    patientId: "user-asha",
    patientName: "Asha Verma",
    orderedById: "user-arjun",
    orderedByName: "Dr Arjun Mehta",
    labInstitutionId: "inst-precision",
    labInstitutionName: "Precision Diagnostics",
    tests: ["HbA1c", "Complete Blood Count"],
    status: "PENDING" as const,
    resultRecordId: null,
    createdAt: "2026-10-21T09:30:00.000Z",
  };

  it("accepts a valid lab order DTO", () => {
    expect(LabOrderDTO.safeParse(validOrder).success).toBe(true);
  });

  it("rejects an order with empty tests or invalid status", () => {
    expect(
      LabOrderDTO.safeParse({
        ...validOrder,
        tests: [],
      }).success
    ).toBe(false);

    expect(
      LabOrderDTO.safeParse({
        ...validOrder,
        status: "UNKNOWN_STATUS",
      }).success
    ).toBe(false);
  });
});

describe("LabOrderListQuery", () => {
  it("defaults pagination and accepts status filter", () => {
    const parsed = LabOrderListQuery.parse({ status: "PENDING" });
    expect(parsed).toEqual({
      status: "PENDING",
      page: 1,
      pageSize: 20,
    });
  });

  it("rejects invalid page size or status", () => {
    expect(LabOrderListQuery.safeParse({ pageSize: "100" }).success).toBe(false);
    expect(LabOrderListQuery.safeParse({ status: "INVALID" }).success).toBe(false);
  });
});

describe("LabResultUpload", () => {
  it("accepts a valid lab result upload input", () => {
    const valid = {
      orderId: "laborder-asha-1",
      summary: "HbA1c: 6.2%, indicating pre-diabetes. CBC within normal limits.",
    };
    expect(LabResultUpload.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty summary", () => {
    expect(
      LabResultUpload.safeParse({
        summary: "   ",
      }).success
    ).toBe(false);
  });
});
