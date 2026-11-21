import "server-only";
import { cookies } from "next/headers";
import type { Role, SessionUser } from "@/contracts/shared";
import { ApiError } from "@/server/http";
import { SESSION_COOKIE, createSessionToken, readSessionToken, sessionHours } from "./token";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }
  return readSessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new ApiError("UNAUTHENTICATED");
  }
  return user;
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionHours() * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

type UserRow = {
  id: string;
  role: Role;
  name: string;
  verified: boolean;
  memberships: { institutionId: string }[];
};

export function toSessionUser(user: UserRow): SessionUser {
  const institutionIds: string[] = [];
  for (const membership of user.memberships) {
    institutionIds.push(membership.institutionId);
  }

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
