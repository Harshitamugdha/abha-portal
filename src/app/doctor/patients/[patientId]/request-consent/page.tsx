import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { getPatientHeader } from "@/server/clinical/lookup";
import { DOCTOR_LINKS } from "../../../doctor-links";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function RequestConsentPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const { patientId } = await params;
  const header = await getPatientHeader(user, patientId).catch(() => null);

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead
          kicker="Doctor portal"
          title={`Request access: ${header?.name || patientId}`}
        />

        <div className="container dashboard">
          <div className="alert-panel" role="alert" style={{ borderLeftColor: "#0066cc" }}>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Consent Request Form (Coming in Slice P3.3)
            </h2>
            <p className="text-sm text-slate-700 mb-4">
              The interactive consent request form (scopes, duration, purpose) will be implemented in the next slice (<strong>P3.3</strong>).
            </p>
            <p className="text-sm text-slate-600 mb-4">
              For testing <strong>Slice P3.2</strong>, a pending consent request from Dr Arjun is <strong>already pre-seeded in the database</strong>. Simply log in as Asha in your second browser profile, open <strong>/patient/consents</strong>, and approve it there.
            </p>
            <div className="row" style={{ gap: "10px" }}>
              <Link href={`/doctor/patients/${patientId}`} className="btn btn-accent">
                ← Back to patient records
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
