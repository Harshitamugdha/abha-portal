// Creating and checking the session JWT (CONTRACTS §5).
//
// No `import "server-only"` here, on purpose: proxy.ts imports this file, and the proxy runs outside
// React's server environment, where "server-only" would throw. This file is still server-only in
// practice: it reads JWT_SECRET, which has no NEXT_PUBLIC_ prefix, so it never reaches the browser
// (TRAPS §9). Never import it from a 'use client' file.

import { SignJWT, jwtVerify } from "jose";
import { SessionUser } from "@/contracts/shared";

export const SESSION_COOKIE = "portal_session";

export function sessionHours(): number {
  const hours = Number(process.env.SESSION_HOURS);
  if (hours > 0) {
    return hours;
  }
  return 8;
}

// The secret that signs every token. Without it nobody can be logged in, so we fail loudly.
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-with")) {
    throw new Error("JWT_SECRET must be set to 32+ random characters (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

// Make a signed token that carries the logged-in user. Expires after SESSION_HOURS (default 8).
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user: user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${sessionHours()}h`)
    .sign(getSecret());
}

// Check a token. Returns the user if the signature is ours and it hasn't expired, otherwise null.
// A tampered or expired cookie simply means "not logged in".
export async function readSessionToken(token: string): Promise<SessionUser | null> {
  const secret = getSecret(); // outside the try: a missing secret must crash, not look like "logged out"

  try {
    const result = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const parsed = SessionUser.safeParse(result.payload.user);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null; // bad signature, expired, or not a JWT at all
  }
}
