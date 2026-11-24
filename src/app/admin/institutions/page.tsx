import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { listInstitutions } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { ADMIN_LINKS } from "../admin-links";
import { InstitutionForm } from "./institution-form";

const TYPE_LABELS: Record<string, string> = {
  HOSPITAL: "Hospital",
  PHARMACY: "Pharmacy",
  LAB: "Lab",
};

export default async function AdminInstitutionsPage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const institutions = await listInstitutions(user);

  return (
    <>
      <TopBar name={user.name} links={ADMIN_LINKS} />
      <main className="landing">
        <PageHead kicker="Administration" title="Institutions" />

        <div className="container dashboard">
          <div className="auth-layout">
            <section aria-labelledby="registered">
              <h2 id="registered" className="section-title">
                Participating institutions ({institutions.length})
              </h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>City</th>
                      <th>ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {institutions.map((inst) => (
                      <tr key={inst.id}>
                        <td>
                          <strong>{inst.name}</strong>
                        </td>
                        <td>
                          <span className="badge badge-grey">{TYPE_LABELS[inst.type] || inst.type}</span>
                        </td>
                        <td>{inst.city}</td>
                        <td>
                          <code>{inst.id}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="add-institution">
              <h2 id="add-institution" className="section-title">
                Add an institution
              </h2>
              <InstitutionForm />
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
