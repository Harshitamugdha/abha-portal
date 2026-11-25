import { requireSession } from "@/server/auth/session";
import { lookupPatient } from "@/server/clinical/lookup";
import { handleRouteError } from "@/server/http";

export async function GET(request: Request) {
  try {
    const user = await requireSession();
    const url = new URL(request.url);
    const abha = url.searchParams.get("abha") || "";
    const patient = await lookupPatient(user, abha);
    return Response.json(patient);
  } catch (error) {
    return handleRouteError(error);
  }
}
