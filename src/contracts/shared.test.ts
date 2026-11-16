import { describe, expect, it } from "vitest";
import { ApiErrorBody, ERROR_STATUS, ErrorCode, PageQuery, RecordType, SessionUser, pageOf } from "./shared";

describe("SessionUser", () => {
  it("accepts a seeded doctor", () => {
    const kavya = {
      id: "user-kavya",
      role: "DOCTOR",
      name: "Dr Kavya Iyer",
      verified: true,
      institutionIds: ["inst-citygen"],
    };
    expect(SessionUser.safeParse(kavya).success).toBe(true);
  });

  it("rejects an unknown role", () => {
    const bad = { id: "user-x", role: "NURSE", name: "X", verified: true, institutionIds: [] };
    expect(SessionUser.safeParse(bad).success).toBe(false);
  });
});

describe("ApiErrorBody", () => {
  it("accepts the error shape from CONTRACTS §1", () => {
    const body = { error: { code: "CONSENT_REQUIRED", message: "Consent required", details: { patientId: "user-asha" } } };
    expect(ApiErrorBody.safeParse(body).success).toBe(true);
  });

  it("rejects a code that isn't in the list", () => {
    const body = { error: { code: "OOPS", message: "no" } };
    expect(ApiErrorBody.safeParse(body).success).toBe(false);
  });

  it("has an HTTP status for every error code", () => {
    for (const code of ErrorCode.options) {
      expect(ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
    }
  });
});

describe("PageQuery", () => {
  it("turns query-string text into numbers and fills defaults", () => {
    expect(PageQuery.parse({ page: "2" })).toEqual({ page: 2, pageSize: 20 });
  });

  it("refuses a page size over 50", () => {
    expect(PageQuery.safeParse({ pageSize: "500" }).success).toBe(false);
  });
});

describe("pageOf", () => {
  const RecordTypePage = pageOf(RecordType);

  it("accepts a valid page", () => {
    const page = { items: ["ENCOUNTER", "LAB_REPORT"], page: 1, pageSize: 20, total: 2 };
    expect(RecordTypePage.safeParse(page).success).toBe(true);
  });

  it("rejects a page with a wrong item inside", () => {
    const page = { items: ["NOT_A_TYPE"], page: 1, pageSize: 20, total: 1 };
    expect(RecordTypePage.safeParse(page).success).toBe(false);
  });
});
