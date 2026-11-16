import "server-only";
import bcrypt from "bcryptjs";
import { HOME_FOR_ROLE } from "@/contracts/auth";
import type { SessionUser } from "@/contracts/shared";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { getAbhaProvider } from "./abha";
import { toSessionUser } from "./session";

// The two ways to log in. Both return the SessionUser; the Route Handler then sets the cookie.

// Patient: ABHA + OTP (the OTP was requested earlier with getAbhaProvider().requestOtp).
export async function loginWithAbha(txnId: string, otp: string): Promise<SessionUser> {
  // Throws OTP_INVALID if the OTP is wrong, expired or used up.
  const { abhaNumber } = await getAbhaProvider().verifyOtp(txnId, otp);

  const profile = await db.abhaProfile.findUnique({
    where: { abhaNumber: abhaNumber },
    include: { user: { include: { memberships: true } } },
  });
  if (!profile) {
    // Real ABHA but no account here. Can't happen with the mock (its directory IS our table).
    throw new ApiError("UNAUTHENTICATED");
  }

  return toSessionUser(profile.user);
}

// Staff: email + password.
// Unknown email and wrong password give the SAME error, so the form can't be used to find out
// which emails have accounts.
export async function loginStaff(email: string, password: string) {
  const wrongDetails = new ApiError("UNAUTHENTICATED", "Email or password is wrong.");

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { memberships: true },
  });
  if (!user || !user.passwordHash || user.role === "PATIENT") {
    throw wrongDetails;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw wrongDetails;
  }

  // Only now (password correct) do we say the account is unverified.
  if (!user.verified) {
    throw new ApiError("STAFF_UNVERIFIED");
  }

  const sessionUser = toSessionUser(user);
  return { user: sessionUser, redirectTo: HOME_FOR_ROLE[sessionUser.role] };
}
