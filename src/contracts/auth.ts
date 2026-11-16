// Shapes for ABHA login (CONTRACTS §4.1). Staff login and registration shapes are added in Phase 2.

import { z } from "zod";

// POST /api/v1/auth/abha/otp
// `abha` is whatever the user typed: "91-1000-0000-0001", "91100000000001" or "asha.verma@abdm".
// The server checks the format with parseAbhaInput().
export const AbhaOtpRequest = z.object({
  abha: z.string().trim().min(1).max(80),
});
export type AbhaOtpRequest = z.infer<typeof AbhaOtpRequest>;

export const AbhaOtpResponse = z.object({
  txnId: z.string().min(1),
  maskedMobile: z.string(), // "******4821"
  devOtp: z.string().optional(), // only in development, to show a hint on the OTP screen
});
export type AbhaOtpResponse = z.infer<typeof AbhaOtpResponse>;

// POST /api/v1/auth/abha/verify
export const AbhaVerifyRequest = z.object({
  txnId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/, "OTP is 6 digits"),
});
export type AbhaVerifyRequest = z.infer<typeof AbhaVerifyRequest>;

// What the ABHA provider tells us about a person.
export const AbhaProfileDTO = z.object({
  abhaNumber: z.string().regex(/^\d{14}$/), // 14 digits, no hyphens
  abhaAddress: z.string(), // lowercase, name@abdm
  name: z.string(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // "1990-04-12"
  gender: z.string(),
});
export type AbhaProfileDTO = z.infer<typeof AbhaProfileDTO>;
