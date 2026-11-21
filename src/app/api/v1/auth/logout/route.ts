import { clearSessionCookie } from "@/server/auth/session";

export async function POST() {
  await clearSessionCookie();
  return new Response(null, { status: 204 });
}
