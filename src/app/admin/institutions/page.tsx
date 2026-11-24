import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { listInstitutions } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { InstitutionForm } from "./institution-form";

export default async function AdminInstitutionsPage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const institutions = await listInstitutions(user);

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/staff", label: "Staff Verification" },
    { href: "/admin/audit", label: "Audit Logs" },
    { href: "/admin/institutions", label: "Institutions" },
  ];

  return (
    <>
      <TopBar name={user.name} links={links} />
      <main className="page">
        <div style={{ marginBottom: "16px" }}>
          <Link href="/admin" className="link">&larr; Back to Admin Panel</Link>
        </div>

        <h1>Institutions Directory</h1>
        <p className="muted" style={{ marginBottom: "20px" }}>
          Manage participating hospitals, pharmacies, and diagnostic laboratories in the ABHA network.
        </p>

        <h2>Register New Institution</h2>
        <div className="card" style={{ marginBottom: "28px" }}>
          <InstitutionForm />
        </div>

        <h2>Registered Institutions ({institutions.length})</h2>
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>City</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst.id}>
                  <td><code>{inst.id}</code></td>
                  <td><strong>{inst.name}</strong></td>
                  <td>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background:
                          inst.type === "HOSPITAL"
                            ? "#e0e7ff"
                            : inst.type === "PHARMACY"
                            ? "#fef3c7"
                            : "#dcfce7",
                      }}
                    >
                      {inst.type}
                    </span>
                  </td>
                  <td>{inst.city}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
