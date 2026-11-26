import { requireSession } from "@/server/auth/session";
import { handleRouteError } from "@/server/http";
import { getFileStream } from "@/server/records/stream";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, props: RouteProps) {
  try {
    const user = await requireSession();
    const { id } = await props.params;
    const file = await getFileStream(user, id);

    return new Response(file.stream, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": "inline",
        "Content-Length": String(file.sizeBytes),
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
