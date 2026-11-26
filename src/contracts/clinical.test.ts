import { describe, expect, it } from "vitest";
import {
  EncounterCreate,
  LabOrderCreate,
  PatientLookupDTO,
  PrescriptionCreate,
  PrescriptionItem,
  ShareCode,
  SummaryDTO,
} from "./clinical";

describe("ShareCode", () => {
  it("passes valid share codes CGEN52 and ASHA7K", () => {
    expect(ShareCode.safeParse("CGEN52").success).toBe(true);
    expect(ShareCode.safeParse("ASHA7K").success).toBe(true);
  });

  it("fails codes with 0, O, 1, I or wrong length", () => {
    expect(ShareCode.safeParse("ASHA0K").success).toBe(false); // contains 0
    expect(ShareCode.safeParse("ASHAOK").success).toBe(false); // contains O
    expect(ShareCode.safeParse("ASHA1K").success).toBe(false); // contains 1
    expect(ShareCode.safeParse("ASHAIK").success).toBe(false); // contains I
    expect(ShareCode.safeParse("ASHA7").success).toBe(false); // length 5
    expect(ShareCode.safeParse("ASHA7KK").success).toBe(false); // length 7
    expect(ShareCode.safeParse("asha7k").success).toBe(false); // lowercase
  });
});

describe("PatientLookupDTO", () => {
  it("accepts valid patient lookup response", () => {
    const valid = {
      patientId: "user-asha",
      name: "Asha Verma",
      abhaNumberMasked: "XX-XXXX-XXXX-0001",
    };
    expect(PatientLookupDTO.safeParse(valid).success).toBe(true);
  });

  it("rejects missing or empty fields", () => {
    expect(
      PatientLookupDTO.safeParse({
        patientId: "",
        name: "Asha",
        abhaNumberMasked: "XX",
      }).success
    ).toBe(false);
  });
});

describe("SummaryDTO", () => {
  it("accepts valid summary by institution", () => {
    const valid = {
      byInstitution: [
        {
          institutionId: "inst-citygen",
          institutionName: "City General Hospital",
          counts: [
            { type: "PRESCRIPTION" as const, count: 2 },
            { type: "LAB_REPORT" as const, count: 1 },
          ],
          latestAt: "2026-10-21T09:30:00.000Z",
        },
      ],
    };
    expect(SummaryDTO.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid count or missing institution details", () => {
    const invalid = {
      byInstitution: [
        {
          institutionId: "",
          institutionName: "City General",
          counts: [{ type: "INVALID_TYPE", count: -1 }],
          latestAt: null,
        },
      ],
    };
    expect(SummaryDTO.safeParse(invalid).success).toBe(false);
  });
});

describe("PrescriptionItem", () => {
  it("accepts a valid prescription item", () => {
    const valid = {
      drug: "Metformin",
      dose: "500 mg",
      frequency: "Twice daily",
      durationDays: 30,
      notes: "After meals",
    };
    expect(PrescriptionItem.safeParse(valid).success).toBe(true);
  });

  it("rejects an item with duration less than 1 or empty drug", () => {
    expect(
      PrescriptionItem.safeParse({
        drug: "",
        dose: "500 mg",
        frequency: "Twice daily",
        durationDays: 0,
      }).success
    ).toBe(false);
  });
});

describe("PrescriptionCreate", () => {
  const validItem = {
    drug: "Metformin",
    dose: "500 mg",
    frequency: "Twice daily",
    durationDays: 30,
  };

  it("accepts a valid prescription create input", () => {
    const valid = {
      patientId: "user-asha",
      items: [validItem],
      notes: "Routine checkup",
    };
    expect(PrescriptionCreate.safeParse(valid).success).toBe(true);
  });

  it("rejects empty items array or more than 10 items", () => {
    expect(
      PrescriptionCreate.safeParse({
        patientId: "user-asha",
        items: [],
      }).success
    ).toBe(false);

    const elevenItems = Array(11).fill(validItem);
    expect(
      PrescriptionCreate.safeParse({
        patientId: "user-asha",
        items: elevenItems,
      }).success
    ).toBe(false);
  });
});

describe("EncounterCreate", () => {
  it("accepts a valid encounter create input", () => {
    const valid = {
      patientId: "user-asha",
      title: "General Checkup",
      summary: "Patient presented with mild fever",
      occurredAt: "2026-10-21T09:30:00.000Z",
    };
    expect(EncounterCreate.safeParse(valid).success).toBe(true);
  });

  it("rejects empty title or invalid occurredAt", () => {
    expect(
      EncounterCreate.safeParse({
        patientId: "user-asha",
        title: "",
        occurredAt: "2026-10-21T09:30:00.000Z",
      }).success
    ).toBe(false);

    expect(
      EncounterCreate.safeParse({
        patientId: "user-asha",
        title: "Checkup",
        occurredAt: "not-date",
      }).success
    ).toBe(false);
  });
});

describe("LabOrderCreate", () => {
  it("accepts a valid lab order create input", () => {
    const valid = {
      patientId: "user-asha",
      labInstitutionId: "inst-precision",
      tests: ["HbA1c", "Lipid Profile"],
    };
    expect(LabOrderCreate.safeParse(valid).success).toBe(true);
  });

  it("rejects empty tests array or more than 10 tests", () => {
    expect(
      LabOrderCreate.safeParse({
        patientId: "user-asha",
        labInstitutionId: "inst-precision",
        tests: [],
      }).success
    ).toBe(false);

    const elevenTests = Array(11).fill("HbA1c");
    expect(
      LabOrderCreate.safeParse({
        patientId: "user-asha",
        labInstitutionId: "inst-precision",
        tests: elevenTests,
      }).success
    ).toBe(false);
  });
});
