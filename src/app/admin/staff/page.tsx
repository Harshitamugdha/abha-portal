import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { formatIST } from "@/contracts/format";
import { listStaff } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { VerifyButton } from "./verify-button";

export default async function AdminStaffPage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const [pendingStaff, verifiedStaff] = await Promise.all([
    listStaff(user, { verified: false, pageSize: 50 }),
    listStaff(user, { verified: true, pageSize: 50 }),
  ]);

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

        <h1>Staff Verification Queue</h1>
        <p className="muted" style={{ marginBottom: "20px" }}>
          Newly registered healthcare professionals cannot log in until an administrator verifies their credentials.
        </p>

        <h2>Pending Verification ({pendingStaff.total})</h2>
        {pendingStaff.items.length === 0 ? (
          <div className="card">
            <p className="muted">No staff members currently awaiting verification.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>HPR / Reg ID</th>
                  <th>Affiliation</th>
                  <th>Registered At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingStaff.items.map((staff) => (
                  <tr key={staff.id}>
                    <td><strong>{staff.name}</strong></td>
                    <td><span style={{ fontSize: "0.8rem", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>{staff.role}</span></td>
                    <td>{staff.email}</td>
                    <td>{staff.hprId || "-"}</td>
                    <td>{staff.institutionNames?.join(", ") || "-"}</td>
                    <td>{formatIST(staff.createdAt)}</td>
                    <td>
                      <VerifyButton userId={staff.id} name={staff.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2>Verified Staff ({verifiedStaff.total})</h2>
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Affiliation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {verifiedStaff.items.map((staff) => (
                <tr key={staff.id}>
                  <td><strong>{staff.name}</strong></td>
                  <td><span style={{ fontSize: "0.8rem", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "4px" }}>{staff.role}</span></td>
                  <td>{staff.email}</td>
                  <td>{staff.institutionNames?.join(", ") || "-"}</td>
                  <td><span className="success" style={{ fontWeight: 600 }}>Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
