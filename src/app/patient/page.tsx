import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { PATIENT_LINKS } from "./patient-links";

export default async function PatientHomePage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="page">
        <h1>Welcome, {user.name}</h1>
        <div className="card">
          <Link className="link" href="/patient/consents">
            Consents
          </Link>
          <p className="muted">Approve, deny or revoke doctors&apos; access to your records.</p>
        </div>
        <div className="card">
          <Link className="link" href="/patient/access-log">
            Who viewed my records
          </Link>
          <p className="muted">Every look at your records, including refused ones.</p>
        </div>
      </main>
    </>
  );
}
