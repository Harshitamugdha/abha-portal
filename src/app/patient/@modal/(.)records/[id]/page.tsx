import { notFound, redirect } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { RecordDetailView } from "@/components/ui/record-detail-view";
import { getSession } from "@/server/auth/session";
import { ApiError } from "@/server/http";
import { getRecord } from "@/server/records/list";

type InterceptedRecordModalProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InterceptedRecordModalPage(props: InterceptedRecordModalProps) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const { id } = await props.params;

  let record;
  try {
    record = await getRecord(user, id);
  } catch (error) {
    if (error instanceof ApiError && (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")) {
      notFound();
    }
    throw error;
  }

  return (
    <Modal title={record.title}>
      <RecordDetailView record={record} />
    </Modal>
  );
}
