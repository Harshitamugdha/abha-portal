import { describe, expect, it } from "vitest";
import { RecordDTO } from "@/contracts/records";
import { DOCTOR_VIEWER_FIXTURES } from "./fixtures";

describe("Doctor Patient Viewer Fixtures", () => {
  it("all fixtures strictly parse against RecordDTO schema", () => {
    expect(DOCTOR_VIEWER_FIXTURES.length).toBeGreaterThan(0);

    for (const fixture of DOCTOR_VIEWER_FIXTURES) {
      const result = RecordDTO.safeParse(fixture);
      expect(result.success).toBe(true);
    }
  });

  it("contains records across multiple institutions", () => {
    const institutions = new Set(DOCTOR_VIEWER_FIXTURES.map((r) => r.institutionName));
    expect(institutions.size).toBeGreaterThan(1);
    expect(institutions.has("City General Hospital")).toBe(true);
    expect(institutions.has("Sunrise Multispeciality")).toBe(true);
  });
});
