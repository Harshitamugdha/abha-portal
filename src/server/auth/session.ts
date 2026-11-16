import "server-only";
import type { SessionUser } from "@/contracts/shared";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

// ============================================================================================
// STUB — Phase 0 only. Replaced in Phase 2 by a real JWT in the `portal_session` cookie.
//
// While the stub is in place, the logged-in user is whoever DEV_FAKE_USER names in .env:
//   DEV_FAKE_USER="kavya"   -> every request runs as the seeded user "user-kavya"
// Allowed names: asha | rohan | meera | kavya | arjun | neel | pharmacy | lab | admin
//
// It only works in development, so a forgotten DEV_FAKE_USER can never log anyone in on the
// deployed site.
// ============================================================================================

// Who is logged in? Returns null if nobody is.
export async function getSession(): Promise<SessionUser | null> {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const fakeUserName = process.env.DEV_FAKE_USER;
  if (!fakeUserName) {
    return null;
  }

  // Seeded users have fixed ids: "kavya" -> "user-kavya".
  const user = await db.user.findUnique({
    where: { id: `user-${fakeUserName}` },
    include: { memberships: true },
  });
  if (!user) {
    return null;
  }

  return toSessionUser(user);
}

// Same as getSession, but refuses if nobody is logged in.
// Every Server Action and protected data path starts with this (TRAPS §2).
export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new ApiError("UNAUTHENTICATED");
  }
  return user;
}

// Build the SessionUser field by field (TRAPS §17): never pass the database row itself,
// because it contains passwordHash.
type UserWithMemberships = {
  id: string;
  role: SessionUser["role"];
  name: string;
  verified: boolean;
  memberships: { institutionId: string }[];
};

function toSessionUser(user: UserWithMemberships): SessionUser {
  const institutionIds = user.memberships.map((m) => m.institutionId);

  const sessionUser: SessionUser = {
    id: user.id,
    role: user.role,
    name: user.name,
    verified: user.verified,
    institutionIds: institutionIds,
  };

  if (user.role === "PATIENT") {
    sessionUser.patientId = user.id;
  }

  return sessionUser;
}
