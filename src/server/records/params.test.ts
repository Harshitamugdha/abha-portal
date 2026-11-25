import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/http";
import { parseRecordListParams } from "./params";

describe("parseRecordListParams helper", () => {
  it("parses valid repeated type into types array", () => {
    const sp = new URLSearchParams();
    sp.append("type", "LAB_REPORT");
    sp.append("type", "PRESCRIPTION");

    const query = parseRecordListParams("user-asha", sp);
    expect(query.patientId).toBe("user-asha");
    expect(query.types).toEqual(["LAB_REPORT", "PRESCRIPTION"]);
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(20);
  });

  it("parses single type", () => {
    const sp = new URLSearchParams("type=ENCOUNTER");
    const query = parseRecordListParams("user-asha", sp);
    expect(query.type).toBe("ENCOUNTER");
    expect(query.types).toEqual(["ENCOUNTER"]);
  });

  it("bad page gives VALIDATION_FAILED", () => {
    const badPages = ["0", "-1", "abc", "NaN"];
    for (const page of badPages) {
      const sp = new URLSearchParams({ page });
      expect(() => parseRecordListParams("user-asha", sp)).toThrowError(
        expect.objectContaining({
          code: "VALIDATION_FAILED",
        }),
      );
    }
  });

  it("bad date gives VALIDATION_FAILED", () => {
    const badDates = ["bad-date", "2026-99-99", "tomorrow", "invalid"];
    for (const date of badDates) {
      const spFrom = new URLSearchParams({ from: date });
      expect(() => parseRecordListParams("user-asha", spFrom)).toThrowError(
        expect.objectContaining({
          code: "VALIDATION_FAILED",
        }),
      );

      const spTo = new URLSearchParams({ to: date });
      expect(() => parseRecordListParams("user-asha", spTo)).toThrowError(
        expect.objectContaining({
          code: "VALIDATION_FAILED",
        }),
      );
    }
  });

  it("parses valid date string (YYYY-MM-DD) into ISO datetime", () => {
    const sp = new URLSearchParams({
      from: "2026-09-01",
      to: "2026-09-30",
      institutionId: "inst-citygen",
      page: "2",
      pageSize: "10",
    });

    const query = parseRecordListParams("user-asha", sp);
    expect(query.patientId).toBe("user-asha");
    expect(query.institutionId).toBe("inst-citygen");
    expect(query.from).toBe("2026-09-01T00:00:00.000Z");
    expect(query.to).toBe("2026-09-30T23:59:59.999Z");
    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(10);
  });

  it("parses already valid ISO datetime strings", () => {
    const sp = new URLSearchParams({
      from: "2026-09-01T04:30:00.000Z",
      to: "2026-09-30T18:00:00.000Z",
    });

    const query = parseRecordListParams("user-asha", sp);
    expect(query.from).toBe("2026-09-01T04:30:00.000Z");
    expect(query.to).toBe("2026-09-30T18:00:00.000Z");
  });

  it("handles plain object input", () => {
    const query = parseRecordListParams("user-asha", {
      type: ["LAB_REPORT", "DOCUMENT"],
      institutionId: "inst-sunrise",
      page: "1",
    });

    expect(query.types).toEqual(["LAB_REPORT", "DOCUMENT"]);
    expect(query.institutionId).toBe("inst-sunrise");
  });

  it("throws VALIDATION_FAILED when patientId is missing or empty", () => {
    const sp = new URLSearchParams();
    expect(() => parseRecordListParams("", sp)).toThrow(ApiError);
  });
});
