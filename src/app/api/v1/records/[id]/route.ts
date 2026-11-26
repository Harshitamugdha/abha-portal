import { requireSession } from "@/server/auth/session";
import { handleRouteError } from "@/server/http";
import { getRecord } from "@/server/records/list";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, props: RouteProps) {
  try {
    const user = await requireSession();
    const { id } = await props.params;
    const record = await getRecord(user, id);
    return Response.json(record);
  } catch (error) {
    return handleRouteError(error);
  }
}
