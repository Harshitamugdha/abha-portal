import { describe, expect, it } from "vitest";
import { toPublicInstitutionDTO } from "./institutions";

describe("toPublicInstitutionDTO directory mapper", () => {
  it("returns only id, name, type, and city, omitting sensitive or extra database fields", () => {
    const rawInstitution = {
      id: "inst-citygen",
      name: "City General Hospital",
      type: "HOSPITAL" as const,
      city: "Bengaluru",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
      internalNotes: "Confidential administration notes",
      memberships: [{ userId: "user-1" }],
      records: [{ id: "rec-1" }],
      consents: [{ id: "con-1" }],
      licenseNumber: "BLR-HOSP-9999",
    };

    const dto = toPublicInstitutionDTO(rawInstitution);

    expect(dto).toEqual({
      id: "inst-citygen",
      name: "City General Hospital",
      type: "HOSPITAL",
      city: "Bengaluru",
    });

    const keys = Object.keys(dto).sort();
    expect(keys).toEqual(["city", "id", "name", "type"]);
    expect(keys.length).toBe(4);
  });
});
