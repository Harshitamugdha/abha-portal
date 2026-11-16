import { describe, expect, it } from "vitest";
import { AbhaOtpRequest, AbhaVerifyRequest, StaffLoginRequest, StaffRegisterRequest } from "./auth";

describe("AbhaOtpRequest", () => {
  it("accepts anything typed into the ABHA box", () => {
    expect(AbhaOtpRequest.safeParse({ abha: "91-1000-0000-0001" }).success).toBe(true);
  });

  it("rejects an empty box", () => {
    expect(AbhaOtpRequest.safeParse({ abha: "   " }).success).toBe(false);
  });
});

describe("AbhaVerifyRequest", () => {
  it("accepts a 6-digit OTP", () => {
    expect(AbhaVerifyRequest.safeParse({ txnId: "abc", otp: "123456" }).success).toBe(true);
  });

  it("rejects an OTP that isn't 6 digits", () => {
    expect(AbhaVerifyRequest.safeParse({ txnId: "abc", otp: "12345a" }).success).toBe(false);
  });
});

describe("StaffRegisterRequest", () => {
  const doctor = {
    name: "Dr Test",
    email: "test@citygen.test",
    password: "Demo@1234",
    role: "DOCTOR",
    institutionId: "inst-citygen",
    hprId: "HPR-TEST-1",
  };

  it("accepts a doctor with an HPR id", () => {
    expect(StaffRegisterRequest.safeParse(doctor).success).toBe(true);
  });

  it("rejects a doctor without an HPR id", () => {
    expect(StaffRegisterRequest.safeParse({ ...doctor, hprId: undefined }).success).toBe(false);
  });

  it("accepts lab staff without an HPR id", () => {
    const lab = { ...doctor, role: "LAB", institutionId: "inst-precision", hprId: undefined };
    expect(StaffRegisterRequest.safeParse(lab).success).toBe(true);
  });

  it("rejects ADMIN as a role", () => {
    expect(StaffRegisterRequest.safeParse({ ...doctor, role: "ADMIN" }).success).toBe(false);
  });

  it("rejects a short password", () => {
    expect(StaffRegisterRequest.safeParse({ ...doctor, password: "short" }).success).toBe(false);
  });
});

describe("StaffLoginRequest", () => {
  it("accepts an email and password", () => {
    expect(StaffLoginRequest.safeParse({ email: "kavya@citygen.test", password: "x" }).success).toBe(true);
  });

  it("rejects something that isn't an email", () => {
    expect(StaffLoginRequest.safeParse({ email: "kavya", password: "x" }).success).toBe(false);
  });
});
