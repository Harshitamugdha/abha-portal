import { z } from "zod";
import { AbhaOtpRequest } from "@/contracts/auth";
import { getAbhaProvider } from "@/server/auth/abha";
import { apiError, handleRouteError, readJsonBody } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = AbhaOtpRequest.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_FAILED", undefined, z.flattenError(parsed.error));
    }

    const reply = await getAbhaProvider().requestOtp(parsed.data.abha);
    return Response.json(reply);
  } catch (error) {
    return handleRouteError(error);
  }
}
