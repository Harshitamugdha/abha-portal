import "server-only";
import bcrypt from "bcryptjs";
import { HOME_FOR_ROLE } from "@/contracts/auth";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { getAbhaProvider } from "./abha";
import { toSessionUser } from "./session";

export async function loginWithAbha(txnId: string, otp: string) {
  const result = await getAbhaProvider().verifyOtp(txnId, otp);

  const profile = await db.abhaProfile.findUnique({
    where: { abhaNumber: result.abhaNumber },
    include: { user: { include: { memberships: true } } },
  });
  if (!profile) {
    throw new ApiError("UNAUTHENTICATED");
  }

  return toSessionUser(profile.user);
}

export async function loginStaff(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { memberships: true },
  });

  if (!user || !user.passwordHash || user.role === "PATIENT") {
    throw new ApiError("UNAUTHENTICATED", "Email or password is wrong.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError("UNAUTHENTICATED", "Email or password is wrong.");
  }

  if (!user.verified) {
    throw new ApiError("STAFF_UNVERIFIED");
  }

  const sessionUser = toSessionUser(user);
  return { user: sessionUser, redirectTo: HOME_FOR_ROLE[sessionUser.role] };
}
