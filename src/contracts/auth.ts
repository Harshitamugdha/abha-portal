// Shapes for login and registration (CONTRACTS §4.1).

import { z } from "zod";
import { SessionUser, type Role } from "./shared";

// Where each role lands after login, and where the proxy sends someone who opens the wrong area.
export const HOME_FOR_ROLE: Record<Role, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  PHARMACY: "/pharmacy",
  LAB: "/lab",
  ADMIN: "/admin",
};

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

// ---------- Staff login: POST /api/v1/auth/staff/login ----------

export const StaffLoginRequest = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});
export type StaffLoginRequest = z.infer<typeof StaffLoginRequest>;

export const StaffLoginResponse = z.object({
  user: SessionUser,
  redirectTo: z.string(), // "/doctor", "/lab", "/pharmacy" or "/admin"
});
export type StaffLoginResponse = z.infer<typeof StaffLoginResponse>;

// ---------- Staff registration: registerStaff Server Action ----------

// Admin accounts can't be self-registered.
export const RegistrableRole = z.enum(["DOCTOR", "PHARMACY", "LAB"]);
export type RegistrableRole = z.infer<typeof RegistrableRole>;

export const StaffRegisterRequest = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(200),
    password: z.string().min(8, "Use at least 8 characters").max(200),
    role: RegistrableRole,
    institutionId: z.string().min(1),
    hprId: z.string().trim().max(40).optional(),
  })
  // Doctors must give their Health Professional Registry id.
  .refine(
    (data) => {
      if (data.role === "DOCTOR" && !data.hprId) {
        return false; // a doctor without an HPR id is not allowed
      }
      return true;
    },
    {
      message: "Doctors must enter their HPR id",
      path: ["hprId"],
    },
  );
export type StaffRegisterRequest = z.infer<typeof StaffRegisterRequest>;
