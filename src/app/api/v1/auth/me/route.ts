import { getSession } from "@/server/auth/session";
import { apiError } from "@/server/http";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return apiError("UNAUTHENTICATED");
  }
  return Response.json({ user: user });
}
