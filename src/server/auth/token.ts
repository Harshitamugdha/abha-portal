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

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("replace-with")) {
    throw new Error("JWT_SECRET must be set to 32+ random characters (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const token = new SignJWT({ user: user });
  token.setProtectedHeader({ alg: "HS256" });
  token.setIssuedAt();
  token.setExpirationTime(`${sessionHours()}h`);
  return token.sign(getSecret());
}

export async function readSessionToken(token: string): Promise<SessionUser | null> {
  const secret = getSecret();

  try {
    const result = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const parsed = SessionUser.safeParse(result.payload.user);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}
