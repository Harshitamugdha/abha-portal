import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { formatIST } from "@/contracts/format";
import { getSession } from "@/server/auth/session";
import { ApiError } from "@/server/http";
import { lookupPrescription } from "@/server/pharmacy/pharmacy";
import { PHARMACY_LINKS } from "../../pharmacy-links";
import { DispenseForm } from "./dispense-form";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function PharmacyRxPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const { code } = await params;
  const decodedCode = decodeURIComponent(code).trim().toUpperCase();

  let rx;
  try {
    rx = await lookupPrescription(user, decodedCode);
  } catch (error) {
    if (error instanceof ApiError && (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <TopBar name={user.name} links={PHARMACY_LINKS} />
      <main className="landing">
        <PageHead kicker={"Share code " + decodedCode} title="Prescription" />

        <div className="container dashboard">
          <Link href="/pharmacy" className="accent-link">
            Find another prescription
          </Link>

          <div className="auth-layout">
            <div className="form-card">
              <dl className="summary">
                <dt>Patient</dt>
                <dd>{rx.patientName}</dd>
                <dt>Prescribed by</dt>
                <dd>{rx.issuedBy}</dd>
                <dt>Prescribed on</dt>
                <dd>{formatIST(rx.issuedAt)}</dd>
              </dl>

              <h2 className="form-section">Medicines</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dose</th>
                      <th>How often</th>
                      <th>For</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.drug}</strong>
                        </td>
                        <td>{item.dose}</td>
                        <td>{item.frequency}</td>
                        <td>{item.durationDays} days</td>
                        <td>{item.notes || "None"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DispenseForm recordId={rx.recordId} dispensedAt={rx.dispensedAt} />
          </div>
        </div>
      </main>
    </>
  );
}
