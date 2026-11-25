import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { listInstitutions } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { InstitutionManager } from "./institution-manager";

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

        <InstitutionManager institutions={institutions} />
      </main>
    </>
  );
}
