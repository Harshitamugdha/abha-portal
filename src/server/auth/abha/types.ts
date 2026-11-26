import "server-only";
import type { AbhaOtpResponse, AbhaProfileDTO } from "@/contracts/auth";

export interface AbhaProvider {
  requestOtp(abha: string): Promise<AbhaOtpResponse>;
  verifyOtp(txnId: string, otp: string): Promise<{ abhaNumber: string }>;
  getProfile(abhaNumber: string): Promise<AbhaProfileDTO>;
}

export type OtpTxn = {
  id: string;
  rateKey: string;
  abhaNumber: string | null;
  otpHash: string;
  expiresAt: Date;
  wrongAttempts: number;
  usedAt: Date | null;
  createdAt: Date;
};

export interface OtpStore {
  create(txn: OtpTxn): Promise<void>;
  find(id: string): Promise<OtpTxn | null>;
  addWrongAttempt(id: string): Promise<void>;
  markUsed(id: string, at: Date): Promise<boolean>;
  countSince(rateKey: string, since: Date): Promise<number>;
}

export interface OtpSender {
  isConfigured(): boolean;
  send(email: string, otp: string): Promise<void>;
}
