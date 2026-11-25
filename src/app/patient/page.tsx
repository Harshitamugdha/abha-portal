import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import type { ConsentDTO } from "@/contracts/consent";
import { listMyAccessLog } from "@/server/audit/queries";
import { getSession } from "@/server/auth/session";
import { listConsents } from "@/server/consent/engine";
import { listPatientRecords } from "@/server/records/list";
import { PATIENT_LINKS } from "./patient-links";

function splitByStatus(consents: ConsentDTO[]) {
  const waiting: ConsentDTO[] = [];
  let activeCount = 0;
  for (const consent of consents) {
    if (consent.displayStatus === "REQUESTED") {
      waiting.push(consent);
    }
    if (consent.displayStatus === "GRANTED") {
      activeCount = activeCount + 1;
    }
  }
  return { waiting: waiting, activeCount: activeCount };
}

export default async function PatientHomePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const consents = await listConsents(user, { page: 1, pageSize: 50 });
  const accessLog = await listMyAccessLog(user, { page: 1, pageSize: 1 });
  const records = await listPatientRecords(user, { patientId: user.id, pageSize: 1 });
  const { waiting, activeCount } = splitByStatus(consents.items);

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="landing">
        <section className="band">
          <div className="container page-head">
            <p className="step-label">Your account</p>
            <h1 className="auth-title">Welcome, {user.name}</h1>
          </div>
        </section>

        <div className="container dashboard">
          {waiting.length > 0 && (
            <section className="alert-panel" aria-labelledby="action-needed">
              <h2 id="action-needed">Action needed</h2>
              <ul>
                {waiting.map((consent) => (
                  <li key={consent.id}>
                    <span>
                      <strong>{consent.doctorName}</strong> ({consent.institutionName}) is asking to see your records.
                    </span>
                    <Link className="accent-link" href="/patient/consents">
                      Review request
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="at-a-glance">
            <h2 id="at-a-glance" className="section-title">
              At a glance
            </h2>
            <div className="stats">
              <Link href="/patient/records" className="stat">
                <span className="stat-number">{records.total}</span>
                <span className="stat-label">Health records on file</span>
              </Link>
              <Link href="/patient/consents" className="stat">
                <span className="stat-number">{waiting.length}</span>
                <span className="stat-label">Requests waiting for you</span>
              </Link>
              <Link href="/patient/consents" className="stat">
                <span className="stat-number">{activeCount}</span>
                <span className="stat-label">Doctors who can see your records now</span>
              </Link>
              <Link href="/patient/access-log" className="stat">
                <span className="stat-number">{accessLog.total}</span>
                <span className="stat-label">Times your records were checked</span>
              </Link>
            </div>
          </section>

          <section aria-labelledby="services">
            <h2 id="services" className="section-title">
              What you can do
            </h2>
            <div className="tiles">
              <Link href="/patient/records" className="tile">
                <span className="tile-title">Health Records</span>
                <span className="muted">View your medical timeline from all hospitals, clinics, and labs.</span>
              </Link>
              <Link href="/patient/upload" className="tile">
                <span className="tile-title">Upload document</span>
                <span className="muted">Add your own past health records, discharge summaries, or prescriptions.</span>
              </Link>
              <Link href="/patient/consents" className="tile">
                <span className="tile-title">Consents</span>
                <span className="muted">Approve, deny or revoke doctors&apos; access to your records.</span>
              </Link>
              <Link href="/patient/access-log" className="tile">
                <span className="tile-title">Who viewed my records</span>
                <span className="muted">Every look at your records, including refused ones.</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
