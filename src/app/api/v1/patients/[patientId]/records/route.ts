import { requireSession } from "@/server/auth/session";
import { handleRouteError } from "@/server/http";
import { listPatientRecords } from "@/server/records/list";
import { parseRecordListParams } from "@/server/records/params";

type RouteProps = {
  params: Promise<{
    patientId: string;
  }>;
};

export async function GET(request: Request, props: RouteProps) {
  try {
    const user = await requireSession();
    const { patientId } = await props.params;
    const url = new URL(request.url);
    const query = parseRecordListParams(patientId, url.searchParams);
    const data = await listPatientRecords(user, query);
    return Response.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
