import "server-only";
import type { AbhaProfileDTO } from "@/contracts/auth";

// The ABHA provider: the service that knows who owns an ABHA number and sends them an OTP.
// Today the only one is MockAbhaProvider (D1). A real ABDM provider would implement this same
// interface, and nothing else in the app would change.

export interface AbhaProvider {
  // Step 1: the user typed their ABHA. Start a login "transaction" and send an OTP.
  // Throws ApiError("VALIDATION_FAILED") for a badly typed ABHA,
  //        ApiError("RATE_LIMITED") after 3 requests in 10 minutes.
  requestOtp(abha: string): Promise<{ txnId: string; maskedMobile: string; devOtp?: string }>;

  // Step 2: the user typed the OTP. Returns their ABHA number if it's right.
  // Throws ApiError("OTP_INVALID") if it's wrong, expired or the transaction is gone.
  verifyOtp(txnId: string, otp: string): Promise<{ abhaNumber: string }>;

  // Their profile (name, date of birth...). Throws ApiError("NOT_FOUND") if there is none.
  getProfile(abhaNumber: string): Promise<AbhaProfileDTO>;
}
