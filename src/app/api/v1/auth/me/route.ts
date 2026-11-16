import { getSession } from "@/server/auth/session";
import { apiError } from "@/server/http";

// GET /api/v1/auth/me -> { user: SessionUser }, or 401 UNAUTHENTICATED (CONTRACTS §4.1).
// The screens use it to ask "who am I logged in as?".

export async function GET() {
  const user = await getSession();
  if (!user) {
    return apiError("UNAUTHENTICATED");
  }
  return Response.json({ user: user });
}
