import { z } from "zod";
import { SessionUser, type Role } from "./shared";

export const HOME_FOR_ROLE: Record<Role, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  PHARMACY: "/pharmacy",
  LAB: "/lab",
  ADMIN: "/admin",
};

export const AbhaOtpRequest = z.object({
  abha: z.string().trim().min(1).max(80),
});
export type AbhaOtpRequest = z.infer<typeof AbhaOtpRequest>;

export const AbhaOtpResponse = z.object({
  txnId: z.string().min(1),
  maskedMobile: z.string(),
  devOtp: z.string().optional(),
});
export type AbhaOtpResponse = z.infer<typeof AbhaOtpResponse>;

export const AbhaVerifyRequest = z.object({
  txnId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/, "OTP is 6 digits"),
});
export type AbhaVerifyRequest = z.infer<typeof AbhaVerifyRequest>;

export const AbhaProfileDTO = z.object({
  abhaNumber: z.string().regex(/^\d{14}$/),
  abhaAddress: z.string(),
  name: z.string(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string(),
});
export type AbhaProfileDTO = z.infer<typeof AbhaProfileDTO>;

export const StaffLoginRequest = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});
export type StaffLoginRequest = z.infer<typeof StaffLoginRequest>;

export const StaffLoginResponse = z.object({
  user: SessionUser,
  redirectTo: z.string(),
});
export type StaffLoginResponse = z.infer<typeof StaffLoginResponse>;

export const RegistrableRole = z.enum(["DOCTOR", "PHARMACY", "LAB"]);
export type RegistrableRole = z.infer<typeof RegistrableRole>;

function doctorHasHprId(data: { role: RegistrableRole; hprId?: string }) {
  if (data.role === "DOCTOR" && !data.hprId) {
    return false;
  }
  return true;
}

export const StaffRegisterRequest = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(200),
    password: z.string().min(8, "Use at least 8 characters").max(200),
    role: RegistrableRole,
    institutionId: z.string().min(1),
    hprId: z.string().trim().max(40).optional(),
  })
  .refine(doctorHasHprId, { message: "Doctors must enter their HPR id", path: ["hprId"] });
export type StaffRegisterRequest = z.infer<typeof StaffRegisterRequest>;
