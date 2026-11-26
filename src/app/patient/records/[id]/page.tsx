import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { RecordDetailView } from "@/components/ui/record-detail-view";
import { getSession } from "@/server/auth/session";
import { ApiError } from "@/server/http";
import { getRecord } from "@/server/records/list";
import { PATIENT_LINKS } from "../../patient-links";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PatientRecordDetailPage(props: PageProps) {
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
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="landing">
        <section className="band">
          <div className="container page-head">
            <p className="step-label">Record details</p>
            <h1 className="auth-title">{record.title}</h1>
          </div>
        </section>

        <div className="container dashboard">
          <div className="mb-4">
            <Link href="/patient/records" className="accent-link">
              ← Back to health records
            </Link>
          </div>

          <div className="card space-y-6">
            <RecordDetailView record={record} />
          </div>
        </div>
      </main>
    </>
  );
}
