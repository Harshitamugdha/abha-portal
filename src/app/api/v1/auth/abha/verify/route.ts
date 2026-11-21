import { z } from "zod";
import { AbhaVerifyRequest } from "@/contracts/auth";
import { loginWithAbha } from "@/server/auth/login";
import { setSessionCookie } from "@/server/auth/session";
import { apiError, handleRouteError, readJsonBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = AbhaVerifyRequest.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }

    const user = await loginWithAbha(parsed.data.txnId, parsed.data.otp);
    await setSessionCookie(user);
    return Response.json({ user: user });
  } catch (error) {
    return handleRouteError(error);
  }
}
