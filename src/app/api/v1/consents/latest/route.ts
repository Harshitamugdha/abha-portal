import { requireSession } from "@/server/auth/session";
import { latestConsent } from "@/server/consent/engine";
import { apiError, handleRouteError } from "@/server/http";

export async function GET(request: Request) {
  try {
    const user = await requireSession();
    const patientId = new URL(request.url).searchParams.get("patientId");
    if (!patientId) {
      return apiError("VALIDATION_FAILED", "patientId is required.");
    }
    const consent = await latestConsent(user, patientId);
    return Response.json({ consent: consent });
  } catch (error) {
    return handleRouteError(error);
  }
}
