import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { formatIST } from "@/contracts/format";
import { getSession } from "@/server/auth/session";
import { ApiError } from "@/server/http";
import { lookupPrescription } from "@/server/pharmacy/pharmacy";
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
      <TopBar name={user.name} links={[{ href: "/pharmacy", label: "Lookup" }]} />
      <main className="page">
        <div style={{ marginBottom: "16px" }}>
          <Link href="/pharmacy" className="link">
            &larr; Back to Lookup
          </Link>
        </div>

        <h1>Prescription Details</h1>

        <div className="card">
          <p>
            <strong>Share Code:</strong> <span style={{ letterSpacing: "1px" }}>{decodedCode}</span>
          </p>
          <p>
            <strong>Patient Name:</strong> {rx.patientName}
          </p>
          <p>
            <strong>Issued By:</strong> {rx.issuedBy}
          </p>
          <p>
            <strong>Issued At:</strong> {formatIST(rx.issuedAt)}
          </p>
        </div>

        <h2>Medications</h2>
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Drug</th>
                <th>Dose</th>
                <th>Frequency</th>
                <th>Duration</th>
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
                  <td>{item.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DispenseForm recordId={rx.recordId} dispensedAt={rx.dispensedAt} />
      </main>
    </>
  );
}
