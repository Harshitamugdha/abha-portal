import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { listInstitutions, listStaff, queryAudit } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { ADMIN_LINKS } from "./admin-links";

export default async function AdminHomePage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const pending = await listStaff(user, { verified: false, pageSize: 1 });
  const institutions = await listInstitutions(user);
  const refused = await queryAudit(user, { outcome: "DENIED", pageSize: 1 });

  let waitingText = pending.total + " staff accounts are waiting for verification.";
  if (pending.total === 1) {
    waitingText = "1 staff account is waiting for verification.";
  }

  return (
    <>
      <TopBar name={user.name} links={ADMIN_LINKS} />
      <main className="landing">
        <PageHead kicker="Administration" title={"Welcome, " + user.name} />

        <div className="container dashboard">
          {pending.total > 0 && (
            <section className="alert-panel" aria-labelledby="action-needed">
              <h2 id="action-needed">Action needed</h2>
              <ul>
                <li>
                  <span>{waitingText}</span>
                  <Link className="accent-link" href="/admin/staff">
                    Review staff
                  </Link>
                </li>
              </ul>
            </section>
          )}

          <section aria-labelledby="at-a-glance">
            <h2 id="at-a-glance" className="section-title">
              At a glance
            </h2>
            <div className="stats">
              <Link href="/admin/staff" className="stat">
                <span className="stat-number">{pending.total}</span>
                <span className="stat-label">Staff waiting for verification</span>
              </Link>
              <Link href="/admin/institutions" className="stat">
                <span className="stat-number">{institutions.length}</span>
                <span className="stat-label">Participating institutions</span>
              </Link>
              <Link href="/admin/audit?outcome=DENIED" className="stat">
                <span className="stat-number">{refused.total}</span>
                <span className="stat-label">Refused access attempts</span>
              </Link>
            </div>
          </section>

          <section aria-labelledby="services">
            <h2 id="services" className="section-title">
              What you can do
            </h2>
            <div className="tiles">
              <Link href="/admin/staff" className="tile">
                <span className="tile-title">Staff verification</span>
                <span className="muted">Check and verify doctors, pharmacy and lab staff who registered.</span>
              </Link>
              <Link href="/admin/audit" className="tile">
                <span className="tile-title">Audit log</span>
                <span className="muted">Every access decision, allowed or refused, with filters.</span>
              </Link>
              <Link href="/admin/institutions" className="tile">
                <span className="tile-title">Institutions</span>
                <span className="muted">Add hospitals, pharmacies and labs to the network.</span>
              </Link>
            </div>
            <p className="muted tile-status">Administrators cannot open patients&apos; clinical records.</p>
          </section>
        </div>
      </main>
    </>
  );
}
