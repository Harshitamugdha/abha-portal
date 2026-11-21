import { describe, expect, it } from "vitest";
import { ConsentRequest } from "@/contracts/consent";
import { addDays, chooseInstitution, displayStatus, narrowScopes } from "./rules";

const NOW = new Date("2026-11-21T10:00:00Z");

describe("narrowScopes (TRAPS §7)", () => {
  it("keeps only what was requested AND ticked", () => {
    expect(narrowScopes(["PRESCRIPTION", "LAB_REPORT"], ["LAB_REPORT"])).toEqual(["LAB_REPORT"]);
  });

  it("never adds a scope the doctor didn't ask for", () => {
    expect(narrowScopes(["PRESCRIPTION", "LAB_REPORT"], ["PRESCRIPTION", "LAB_REPORT", "DOCUMENT"])).toEqual([
      "PRESCRIPTION",
      "LAB_REPORT",
    ]);
  });

  it("returns nothing when only unrequested scopes are ticked", () => {
    expect(narrowScopes(["PRESCRIPTION"], ["DOCUMENT"])).toEqual([]);
  });
});

describe("addDays", () => {
  it("adds whole days", () => {
    expect(addDays(NOW, 7).toISOString()).toBe("2026-11-28T10:00:00.000Z");
  });
});

describe("displayStatus", () => {
  it("shows a granted consent as GRANTED before it ends", () => {
    expect(displayStatus("GRANTED", new Date("2026-11-22T10:00:00Z"), NOW)).toBe("GRANTED");
  });

  it("shows it as EXPIRED at the exact end time", () => {
    expect(displayStatus("GRANTED", NOW, NOW)).toBe("EXPIRED");
  });

  it("leaves other statuses alone", () => {
    expect(displayStatus("REVOKED", new Date("2026-11-01T10:00:00Z"), NOW)).toBe("REVOKED");
    expect(displayStatus("REQUESTED", null, NOW)).toBe("REQUESTED");
  });
});

describe("chooseInstitution", () => {
  it("uses the only institution a doctor has", () => {
    expect(chooseInstitution(["inst-citygen"])).toBe("inst-citygen");
  });

  it("needs a choice when the doctor has two", () => {
    expect(chooseInstitution(["inst-citygen", "inst-sunrise"])).toBeNull();
  });

  it("accepts a choice that is one of theirs", () => {
    expect(chooseInstitution(["inst-citygen", "inst-sunrise"], "inst-sunrise")).toBe("inst-sunrise");
  });

  it("refuses an institution that isn't theirs", () => {
    expect(chooseInstitution(["inst-citygen"], "inst-lakeside")).toBeNull();
  });
});

describe("ConsentRequest", () => {
  const valid = { patientId: "user-asha", scopes: ["PRESCRIPTION", "LAB_REPORT"], purpose: "Follow-up", durationDays: 7 };

  it("accepts demo step 3's request", () => {
    expect(ConsentRequest.safeParse(valid).success).toBe(true);
  });

  it("refuses more than 30 days", () => {
    expect(ConsentRequest.safeParse({ ...valid, durationDays: 31 }).success).toBe(false);
  });

  it("refuses no scopes", () => {
    expect(ConsentRequest.safeParse({ ...valid, scopes: [] }).success).toBe(false);
  });

  it("refuses a 2-letter purpose", () => {
    expect(ConsentRequest.safeParse({ ...valid, purpose: "ok" }).success).toBe(false);
  });
});
