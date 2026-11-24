import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ConsentRequired } from "@/components/ui/consent-required";
import { EmptyState } from "@/components/ui/empty-state";
import { InstitutionGroup } from "@/components/ui/institution-group";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { RecordDTO } from "@/contracts/records";
import { getSession } from "@/server/auth/session";
import { DOCTOR_LINKS } from "../../doctor-links";
import { DOCTOR_VIEWER_FIXTURES } from "./fixtures";

type PageProps = {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ state?: string }>;
};

export default async function DoctorPatientViewerPage({ params, searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const { patientId } = await params;
  const { state = "records" } = await searchParams;

  const records: RecordDTO[] = DOCTOR_VIEWER_FIXTURES.map((item) => RecordDTO.parse(item));

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead
          kicker={`Patient record: ${patientId}`}
          title="Patient Records Viewer"
        />

        <div className="container dashboard">
          {/* Temporary Dev State Switcher (removed in P3.2) */}
          <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded text-xs flex items-center gap-3">
            <span className="font-semibold text-gray-600">Dev state preview:</span>
            <Link
              href={`/doctor/patients/${patientId}?state=records`}
              className={`px-2 py-1 rounded ${
                state === "records" ? "bg-blue-800 text-white font-medium" : "bg-white border text-gray-700"
              }`}
            >
              1. Records (Consented)
            </Link>
            <Link
              href={`/doctor/patients/${patientId}?state=consent`}
              className={`px-2 py-1 rounded ${
                state === "consent" ? "bg-amber-600 text-white font-medium" : "bg-white border text-gray-700"
              }`}
            >
              2. Consent required
            </Link>
            <Link
              href={`/doctor/patients/${patientId}?state=empty`}
              className={`px-2 py-1 rounded ${
                state === "empty" ? "bg-gray-800 text-white font-medium" : "bg-white border text-gray-700"
              }`}
            >
              3. Empty in scope
            </Link>
          </div>

          {state === "consent" && (
            <ConsentRequired patientId={patientId} patientName="Asha Verma" />
          )}

          {state === "empty" && (
            <EmptyState message="No records in the scopes you have access to." />
          )}

          {state === "records" && <InstitutionGroup records={records} />}
        </div>
      </main>
    </>
  );
}
