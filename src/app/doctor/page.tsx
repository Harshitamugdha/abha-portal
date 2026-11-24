import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { DOCTOR_LINKS } from "./doctor-links";

export default async function DoctorHomePage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead kicker="Doctor portal" title={"Welcome, " + user.name} />

        <div className="container dashboard">
          <section aria-labelledby="services">
            <h2 id="services" className="section-title">
              Clinical actions
            </h2>
            <div className="tiles">
              <Link href="/doctor/patients" className="tile">
                <span className="tile-title">Find a patient</span>
                <span className="muted">
                  Look up a patient by their ABHA number or address to view records or request consent.
                </span>
              </Link>
            </div>
            <p className="muted tile-status">
              Medical records can only be viewed when the patient has approved an active, scoped consent.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
