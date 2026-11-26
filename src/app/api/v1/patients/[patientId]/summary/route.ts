import { requireSession } from "@/server/auth/session";
import { getPatientSummary } from "@/server/clinical/lookup";
import { handleRouteError } from "@/server/http";

type RouteProps = {
  params: Promise<{
    patientId: string;
  }>;
};

export async function GET(_request: Request, props: RouteProps) {
  try {
    const user = await requireSession();
    const { patientId } = await props.params;
    const summary = await getPatientSummary(user, patientId);
    return Response.json(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}
