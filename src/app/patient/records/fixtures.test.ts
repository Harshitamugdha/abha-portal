import { describe, expect, it } from "vitest";
import { RecordDTO } from "@/contracts/records";
import { FIXTURE_RECORDS } from "./fixtures";

describe("Patient Records Fixtures", () => {
  it("all fixture records strictly conform to RecordDTO schema", () => {
    expect(FIXTURE_RECORDS.length).toBeGreaterThan(0);
    for (const record of FIXTURE_RECORDS) {
      const result = RecordDTO.safeParse(record);
      expect(result.success).toBe(true);
    }
  });

  it("contains records across multiple institutions", () => {
    const institutionIds = new Set(FIXTURE_RECORDS.map((r) => r.institutionId));
    expect(institutionIds.size).toBeGreaterThan(1);
    expect(institutionIds.has("inst-citygen")).toBe(true);
    expect(institutionIds.has("inst-sunrise")).toBe(true);
  });
});
