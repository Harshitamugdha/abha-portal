import { describe, expect, it } from "vitest";
import { AbhaOtpRequest, AbhaVerifyRequest } from "./auth";

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
