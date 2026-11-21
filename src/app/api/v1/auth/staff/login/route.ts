import { z } from "zod";
import { StaffLoginRequest } from "@/contracts/auth";
import { loginStaff } from "@/server/auth/login";
import { setSessionCookie } from "@/server/auth/session";
import { apiError, handleRouteError, readJsonBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = StaffLoginRequest.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }

    const result = await loginStaff(parsed.data.email, parsed.data.password);
    await setSessionCookie(result.user);
    return Response.json({ user: result.user, redirectTo: result.redirectTo });
  } catch (error) {
    return handleRouteError(error);
  }
}
