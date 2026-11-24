import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";

export default async function AdminHomePage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const links = [
    { href: "/admin/staff", label: "Staff Verification" },
    { href: "/admin/audit", label: "Audit Logs" },
    { href: "/admin/institutions", label: "Institutions" },
  ];

  return (
    <>
      <TopBar name={user.name} links={links} />
      <main className="page">
        <h1>Admin Control Panel</h1>
        <div className="card">
          <p>
            Welcome, <strong>{user.name}</strong>. You have administrative access to manage staff verification,
            institution directories, and system audit logs.
          </p>
          <p className="muted" style={{ fontSize: "0.9rem", marginTop: "8px" }}>
            Note: Administrators cannot access or view clinical records (enforced by the security boundary).
          </p>
        </div>

        <h2>Administration Sections</h2>
        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div className="card">
            <h3>Staff Verification</h3>
            <p className="muted" style={{ fontSize: "0.85rem", margin: "8px 0 16px" }}>
              Approve self-registered doctors, pharmacists, and lab staff before they can sign in.
            </p>
            <Link href="/admin/staff" className="btn" style={{ display: "inline-block" }}>
              Go to Queue &rarr;
            </Link>
          </div>

          <div className="card">
            <h3>Audit Log Viewer</h3>
            <p className="muted" style={{ fontSize: "0.85rem", margin: "8px 0 16px" }}>
              Inspect every data access attempt with outcome filters (ALLOWED vs DENIED).
            </p>
            <Link href="/admin/audit" className="btn" style={{ display: "inline-block" }}>
              View Logs &rarr;
            </Link>
          </div>

          <div className="card">
            <h3>Institutions</h3>
            <p className="muted" style={{ fontSize: "0.85rem", margin: "8px 0 16px" }}>
              Register and update hospitals, clinics, pharmacies, and diagnostic laboratories.
            </p>
            <Link href="/admin/institutions" className="btn" style={{ display: "inline-block" }}>
              Manage Directory &rarr;
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
