import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { formatIST } from "@/contracts/format";
import { listStaff } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { ADMIN_LINKS } from "../admin-links";
import { VerifyButton } from "./verify-button";

const ROLE_LABELS: Record<string, string> = {
  DOCTOR: "Doctor",
  PHARMACY: "Pharmacy",
  LAB: "Lab",
};

function workplace(names: string[] | undefined) {
  if (!names || names.length === 0) {
    return "Not set";
  }
  return names.join(", ");
}

export default async function AdminStaffPage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const pendingStaff = await listStaff(user, { verified: false, pageSize: 50 });
  const verifiedStaff = await listStaff(user, { verified: true, pageSize: 50 });

  return (
    <>
      <TopBar name={user.name} links={ADMIN_LINKS} />
      <main className="landing">
        <PageHead kicker="Administration" title="Staff verification" />

        <div className="container dashboard">
          <p className="lead">
            People who register as staff cannot log in until you verify them. For doctors, check the HPR ID first.
          </p>

          <section aria-labelledby="pending">
            <h2 id="pending" className="section-title">
              Waiting for verification ({pendingStaff.total})
            </h2>
            {pendingStaff.items.length === 0 && <p className="empty">Nobody is waiting for verification.</p>}
            {pendingStaff.items.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>HPR ID</th>
                      <th>Works at</th>
                      <th>Registered</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStaff.items.map((staff) => (
                      <tr key={staff.id}>
                        <td>
                          <strong>{staff.name}</strong>
                        </td>
                        <td>
                          <span className="badge badge-amber">{ROLE_LABELS[staff.role] || staff.role}</span>
                        </td>
                        <td>{staff.email}</td>
                        <td>{staff.hprId || "Not needed"}</td>
                        <td>{workplace(staff.institutionNames)}</td>
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
          </section>

          <section aria-labelledby="verified">
            <h2 id="verified" className="section-title">
              Verified staff ({verifiedStaff.total})
            </h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Works at</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedStaff.items.map((staff) => (
                    <tr key={staff.id}>
                      <td>
                        <strong>{staff.name}</strong>
                      </td>
                      <td>{ROLE_LABELS[staff.role] || staff.role}</td>
                      <td>{staff.email}</td>
                      <td>{workplace(staff.institutionNames)}</td>
                      <td>
                        <span className="badge badge-green">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
