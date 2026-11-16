import { clearSessionCookie } from "@/server/auth/session";

// POST /api/v1/auth/logout -> 204, cookie removed.
export async function POST() {
  await clearSessionCookie();
  return new Response(null, { status: 204 });
}
