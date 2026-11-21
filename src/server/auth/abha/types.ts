import "server-only";
import type { AbhaOtpResponse, AbhaProfileDTO } from "@/contracts/auth";

export interface AbhaProvider {
  requestOtp(abha: string): Promise<AbhaOtpResponse>;
  verifyOtp(txnId: string, otp: string): Promise<{ abhaNumber: string }>;
  getProfile(abhaNumber: string): Promise<AbhaProfileDTO>;
}
