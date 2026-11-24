import { describe, expect, it } from "vitest";
import { DispensePrescriptionInput, PharmacyPrescriptionDTO, PrescriptionItem } from "./pharmacy";

describe("PrescriptionItem", () => {
  it("accepts a valid prescription item", () => {
    const item = {
      drug: "Amlodipine 5 mg",
      dose: "1 tablet",
      frequency: "Once a day",
      durationDays: 30,
      notes: "Take after breakfast",
    };
    expect(PrescriptionItem.safeParse(item).success).toBe(true);
  });

  it("rejects an item with non-positive duration", () => {
    const bad = {
      drug: "Amlodipine 5 mg",
      dose: "1 tablet",
      frequency: "Once a day",
      durationDays: 0,
    };
    expect(PrescriptionItem.safeParse(bad).success).toBe(false);
  });
});

describe("PharmacyPrescriptionDTO", () => {
  it("accepts a valid prescription DTO", () => {
    const valid = {
      recordId: "rec-asha-rx",
      patientName: "Asha Sharma",
      items: [
        {
          drug: "Amlodipine 5 mg",
          dose: "1 tablet",
          frequency: "Once a day",
          durationDays: 30,
        },
      ],
      issuedBy: "Dr Kavya Iyer",
      issuedAt: "2026-10-21T09:30:00.000Z",
      dispensedAt: null,
    };
    expect(PharmacyPrescriptionDTO.safeParse(valid).success).toBe(true);
  });

  it("rejects when patientName is missing or empty", () => {
    const bad = {
      recordId: "rec-asha-rx",
      patientName: "",
      items: [
        {
          drug: "Amlodipine 5 mg",
          dose: "1 tablet",
          frequency: "Once a day",
          durationDays: 30,
        },
      ],
      issuedBy: "Dr Kavya Iyer",
      issuedAt: "2026-10-21T09:30:00.000Z",
      dispensedAt: null,
    };
    expect(PharmacyPrescriptionDTO.safeParse(bad).success).toBe(false);
  });
});

describe("DispensePrescriptionInput", () => {
  it("accepts valid dispense input", () => {
    expect(DispensePrescriptionInput.safeParse({ recordId: "rec-asha-rx" }).success).toBe(true);
  });

  it("rejects empty recordId", () => {
    expect(DispensePrescriptionInput.safeParse({ recordId: "" }).success).toBe(false);
  });
});
