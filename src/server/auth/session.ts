import "server-only";
import { cookies } from "next/headers";
import type { SessionUser } from "@/contracts/shared";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { SESSION_COOKIE, createSessionToken, readSessionToken, sessionHours } from "./token";

// Who is logged in (CONTRACTS §5).
// The session is a signed JWT in the httpOnly cookie `portal_session`. It is the ONLY place the
// session lives: never localStorage or sessionStorage (rule 8), because page JavaScript can read
// those, and an httpOnly cookie it can't.

// Returns the logged-in user, or null if nobody is.
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    // A tampered or expired cookie gives null here: treated as logged out, never as the fake user.
    return readSessionToken(token);
  }

  return getDevFakeUser();
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

// Log someone in: put a fresh signed token in the cookie. Only Route Handlers and Server Actions
// can set cookies.
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // page JavaScript can't read it, so an XSS bug can't steal the session
    secure: process.env.NODE_ENV === "production", // HTTPS only on the real site (localhost is plain http)
    sameSite: "lax", // not sent on cross-site form posts, which blocks most CSRF
    path: "/",
    maxAge: sessionHours() * 60 * 60, // seconds
  });
}

// Log out: remove the cookie.
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
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

export function toSessionUser(user: UserWithMemberships): SessionUser {
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

// ============================================================================================
// STUB — DELETE IN PHASE 3 (the brief's checkpoint: "delete the DEV_FAKE_USER code path").
// With no cookie, in development only, DEV_FAKE_USER="kavya" logs you in as seeded "user-kavya".
// Names: asha | rohan | meera | kavya | arjun | neel | pharmacy | lab | admin
// ============================================================================================
async function getDevFakeUser(): Promise<SessionUser | null> {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }
  const fakeUserName = process.env.DEV_FAKE_USER;
  if (!fakeUserName) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: `user-${fakeUserName}` },
    include: { memberships: true },
  });
  if (!user) {
    return null;
  }
  return toSessionUser(user);
}
