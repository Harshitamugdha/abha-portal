import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { listConsents } from "@/server/consent/engine";
import { PATIENT_LINKS } from "./patient-links";

export default async function PatientHomePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const waiting = await listConsents(user, { page: 1, pageSize: 1, status: "REQUESTED" });

  let waitingText = "No doctor is waiting for an answer.";
  if (waiting.total === 1) {
    waitingText = "1 doctor is waiting for your answer.";
  }
  if (waiting.total > 1) {
    waitingText = waiting.total + " doctors are waiting for your answer.";
  }

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="page">
        <h1>Welcome, {user.name}</h1>
        <p className="lead">Choose what you want to do.</p>

        <div className="tiles">
          <Link href="/patient/consents" className="tile">
            <span className="tile-title">Consents</span>
            <span className="muted">Approve, deny or revoke doctors&apos; access to your records.</span>
            <span className="row tile-status">
              {waiting.total > 0 && <span className="badge badge-amber">Action needed</span>}
              <span>{waitingText}</span>
            </span>
          </Link>
          <Link href="/patient/access-log" className="tile">
            <span className="tile-title">Who viewed my records</span>
            <span className="muted">Every look at your records, including refused ones.</span>
          </Link>
        </div>
      </main>
    </>
  );
}
