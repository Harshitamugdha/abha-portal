import { describe, expect, it } from "vitest";
import type { Role, SessionUser } from "@/contracts/shared";
import { whereToRedirect } from "./gate";

function userWithRole(role: Role): SessionUser {
  return { id: "user-x", role: role, name: "X", verified: true, institutionIds: [] };
}

describe("logged out", () => {
  it("sends the patient area to the ABHA login", () => {
    expect(whereToRedirect("/patient/records", null)).toBe("/login");
  });

  it("sends every staff area to the staff login", () => {
    expect(whereToRedirect("/doctor", null)).toBe("/staff/login");
    expect(whereToRedirect("/lab/orders/1", null)).toBe("/staff/login");
    expect(whereToRedirect("/pharmacy", null)).toBe("/staff/login");
    expect(whereToRedirect("/admin/audit", null)).toBe("/staff/login");
  });

  it("lets public pages through", () => {
    expect(whereToRedirect("/", null)).toBeNull();
    expect(whereToRedirect("/login", null)).toBeNull();
    expect(whereToRedirect("/institutions", null)).toBeNull();
  });
});

describe("logged in", () => {
  it("lets each role into its own area", () => {
    expect(whereToRedirect("/patient", userWithRole("PATIENT"))).toBeNull();
    expect(whereToRedirect("/doctor/patients/user-asha", userWithRole("DOCTOR"))).toBeNull();
    expect(whereToRedirect("/lab", userWithRole("LAB"))).toBeNull();
    expect(whereToRedirect("/pharmacy/rx/ASHA7K", userWithRole("PHARMACY"))).toBeNull();
    expect(whereToRedirect("/admin/staff", userWithRole("ADMIN"))).toBeNull();
  });

  it("sends a patient who opens /doctor or /admin back to /patient", () => {
    expect(whereToRedirect("/doctor", userWithRole("PATIENT"))).toBe("/patient");
    expect(whereToRedirect("/admin", userWithRole("PATIENT"))).toBe("/patient");
  });

  it("sends a doctor who opens /admin back to /doctor", () => {
    expect(whereToRedirect("/admin/audit", userWithRole("DOCTOR"))).toBe("/doctor");
  });

  it("doesn't confuse /laboratory with /lab", () => {
    expect(whereToRedirect("/laboratory", userWithRole("PATIENT"))).toBeNull();
  });
});
