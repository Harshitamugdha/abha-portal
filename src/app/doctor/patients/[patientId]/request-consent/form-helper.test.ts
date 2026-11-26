import { describe, expect, it } from "vitest";
import { ConsentRequest } from "@/contracts/consent";
import { buildConsentRequest, type ConsentFormValues } from "./form-helper";

describe("buildConsentRequest helper", () => {
  it("builds a valid plain object payload without institutionId when none provided", () => {
    const values: ConsentFormValues = {
      patientId: "user-asha",
      scopes: ["PRESCRIPTION", "LAB_REPORT"],
      purpose: "  Follow-up consultation  ",
      durationDays: "7",
    };

    const payload = buildConsentRequest(values);
    expect(payload).toEqual({
      patientId: "user-asha",
      scopes: ["PRESCRIPTION", "LAB_REPORT"],
      purpose: "Follow-up consultation",
      durationDays: 7,
    });
    expect(ConsentRequest.safeParse(payload).success).toBe(true);
  });

  it("includes trimmed institutionId when provided", () => {
    const values: ConsentFormValues = {
      patientId: "user-asha",
      scopes: ["ENCOUNTER"],
      purpose: "Initial visit",
      durationDays: 14,
      institutionId: "  inst-citygen  ",
    };

    const payload = buildConsentRequest(values);
    expect(payload).toEqual({
      patientId: "user-asha",
      scopes: ["ENCOUNTER"],
      purpose: "Initial visit",
      durationDays: 14,
      institutionId: "inst-citygen",
    });
    expect(ConsentRequest.safeParse(payload).success).toBe(true);
  });
});

describe("ConsentRequest contract schema validation", () => {
  const baseValid: ConsentFormValues = {
    patientId: "user-asha",
    scopes: ["PRESCRIPTION"],
    purpose: "Routine checkup",
    durationDays: 7,
  };

  it("rejects a purpose of 2 chars", () => {
    const payload = buildConsentRequest({ ...baseValid, purpose: "ab" });
    const result = ConsentRequest.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("purpose"))).toBe(true);
    }
  });

  it("rejects duration 0 and 31", () => {
    const dur0 = ConsentRequest.safeParse(buildConsentRequest({ ...baseValid, durationDays: 0 }));
    expect(dur0.success).toBe(false);

    const dur31 = ConsentRequest.safeParse(buildConsentRequest({ ...baseValid, durationDays: 31 }));
    expect(dur31.success).toBe(false);

    // Valid boundaries
    const dur1 = ConsentRequest.safeParse(buildConsentRequest({ ...baseValid, durationDays: 1 }));
    expect(dur1.success).toBe(true);

    const dur30 = ConsentRequest.safeParse(buildConsentRequest({ ...baseValid, durationDays: 30 }));
    expect(dur30.success).toBe(true);
  });

  it("rejects when no scopes are selected", () => {
    const noScopes = ConsentRequest.safeParse(buildConsentRequest({ ...baseValid, scopes: [] }));
    expect(noScopes.success).toBe(false);
    if (!noScopes.success) {
      expect(noScopes.error.issues.some((i) => i.path.includes("scopes"))).toBe(true);
    }
  });

  it("accepts valid requests with 1 to 4 scopes", () => {
    const allScopes = ConsentRequest.safeParse(
      buildConsentRequest({
        ...baseValid,
        scopes: ["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"],
      }),
    );
    expect(allScopes.success).toBe(true);
  });
});
