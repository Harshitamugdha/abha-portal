import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { listInstitutions } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { ADMIN_LINKS } from "../admin-links";
import { InstitutionManager } from "./institution-manager";

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
          <InstitutionManager institutions={institutions} />
        </div>
      </main>
    </>
  );
}
