import { describe, expect, it } from "vitest";
import type { OptimisticPrescription, PrescriptionDraft } from "./optimistic";
import { addPendingPrescription } from "./optimistic";

describe("addPendingPrescription pure helper", () => {
  const existingPrescription: OptimisticPrescription = {
    id: "rec-rx-existing",
    patientId: "user-asha",
    institutionId: "inst-citygen",
    institutionName: "City General Hospital",
    authorId: "user-kavya",
    authorName: "Dr Kavya Iyer",
    type: "PRESCRIPTION",
    title: "Prescription: Amlodipine 5 mg",
    summary: "BP control",
    occurredAt: "2026-11-20T10:00:00.000Z",
    fileId: null,
    createdAt: "2026-11-20T10:00:00.000Z",
    prescription: {
      items: [
        {
          drug: "Amlodipine 5 mg",
          dose: "1 tablet",
          frequency: "Once daily",
          durationDays: 30,
        },
      ],
      shareCode: "CGEN52",
      dispensedAt: null,
      expiresAt: "2026-12-20T10:00:00.000Z",
    },
    isPending: false,
  };

  const draft: PrescriptionDraft = {
    patientId: "user-asha",
    institutionId: "inst-citygen",
    institutionName: "City General Hospital",
    authorName: "Dr Kavya Iyer",
    items: [
      {
        drug: "Paracetamol 650 mg",
        dose: "1 tablet",
        frequency: "SOS",
        durationDays: 3,
        notes: "Take after meals",
      },
      {
        drug: "Cetirizine 10 mg",
        dose: "1 tablet",
        frequency: "At bedtime",
        durationDays: 5,
      },
    ],
    notes: "Fever and allergic rhinitis",
  };

  it("adds a pending row without mutating the original list and keeps the pending flag", () => {
    const originalList = Object.freeze([existingPrescription]);

    // Calling on frozen array will throw if mutation is attempted
    const result = addPendingPrescription(originalList, draft);

    // Verify non-mutation
    expect(originalList).toHaveLength(1);
    expect(originalList[0]).toBe(existingPrescription);

    // Verify new list properties
    expect(result).toHaveLength(2);
    expect(result[0].isPending).toBe(true);
    expect(result[0].title).toBe("Prescription: Paracetamol 650 mg, Cetirizine 10 mg");
    expect(result[0].summary).toBe("Fever and allergic rhinitis");
    expect(result[0].prescription?.items).toEqual(draft.items);
    expect(result[0].prescription?.shareCode).toBe("SAVING");

    // Existing item is preserved in 2nd position
    expect(result[1]).toBe(existingPrescription);
    expect(result[1].isPending).toBe(false);
  });

  it("works seamlessly on an empty list", () => {
    const emptyList: OptimisticPrescription[] = [];
    const result = addPendingPrescription(emptyList, draft);

    expect(result).toHaveLength(1);
    expect(result[0].isPending).toBe(true);
    expect(result[0].patientId).toBe("user-asha");
    expect(result[0].prescription?.items).toHaveLength(2);
    expect(emptyList).toHaveLength(0);
  });
});
