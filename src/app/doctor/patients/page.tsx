import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import type { PatientLookupDTO } from "@/contracts/clinical";
import { getSession } from "@/server/auth/session";
import { lookupPatient } from "@/server/clinical/lookup";
import { ApiError } from "@/server/http";
import { DOCTOR_LINKS } from "../doctor-links";

type PageProps = {
  searchParams: Promise<{
    abha?: string | string[];
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function DoctorPatientsSearchPage(props: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const searchParams = await props.searchParams;
  const rawAbha = typeof searchParams.abha === "string" ? searchParams.abha.trim() : "";

  let patient: PatientLookupDTO | null = null;
  let searchError: { code: string; message: string } | null = null;

  if (rawAbha) {
    try {
      patient = await lookupPatient(user, rawAbha);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "VALIDATION_FAILED") {
          searchError = {
            code: "VALIDATION_FAILED",
            message:
              "Please enter a valid 14-digit ABHA number (e.g. 91-1000-0000-0001) or ABHA address (e.g. asha.verma@abdm).",
          };
        } else if (err.code === "NOT_FOUND") {
          searchError = {
            code: "NOT_FOUND",
            message: `No patient found with ABHA "${rawAbha}". Please check the number or address.`,
          };
        } else {
          searchError = {
            code: err.code,
            message: err.message,
          };
        }
      } else {
        searchError = {
          code: "INTERNAL",
          message: "Something went wrong while searching for the patient. Please try again.",
        };
      }
    }
  }

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead kicker="Doctor portal" title="Find a patient" />

        <div className="container dashboard">
          <div className="auth-layout">
            <div>
              <form method="GET" action="/doctor/patients" className="form-card">
                <label className="label">
                  ABHA number or ABHA address
                  <span className="field-hint">
                    Enter 14-digit number (e.g. 91-1000-0000-0001) or address (e.g. asha.verma@abdm)
                  </span>
                  <input
                    name="abha"
                    type="text"
                    defaultValue={rawAbha}
                    placeholder="91-1000-0000-0001"
                    required
                    autoComplete="off"
                    className="input"
                  />
                </label>
                <div className="form-actions row" style={{ gap: "10px", alignItems: "center" }}>
                  <button type="submit" className="btn btn-accent btn-large">
                    Search patient
                  </button>
                  {rawAbha && (
                    <Link href="/doctor/patients" className="btn btn-secondary">
                      Clear search
                    </Link>
                  )}
                </div>
              </form>

              {searchError && (
                <div className="alert-panel mt-6" role="alert">
                  <p className="error font-medium mb-1">
                    {searchError.code === "VALIDATION_FAILED"
                      ? "Invalid ABHA format"
                      : searchError.code === "NOT_FOUND"
                      ? "Patient not found"
                      : "Search error"}
                  </p>
                  <p className="text-sm text-gray-600">{searchError.message}</p>
                </div>
              )}

              {patient && (
                <div className="card mt-6" style={{ borderLeft: "4px solid #0066cc" }}>
                  <div
                    className="row"
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <span className="badge badge-green">Patient found</span>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "8px 0 4px" }}>
                        {patient.name}
                      </h2>
                      <p className="muted" style={{ margin: 0, fontSize: "0.95rem" }}>
                        ABHA: <strong>{patient.abhaNumberMasked}</strong>
                      </p>
                    </div>
                    <div>
                      <Link
                        href={`/doctor/patients/${patient.patientId}`}
                        className="btn btn-accent btn-large"
                      >
                        Open patient record ↗
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="help-panel" aria-label="Consent and lookup rules">
              <h2>How patient lookup works</h2>
              <ul>
                <li>
                  <strong>Lookup is not access:</strong> Finding a patient returns only their verified name and masked
                  ABHA.
                </li>
                <li>
                  <strong>Consent required:</strong> To view records from participating institutions, you must request
                  and receive scoped, time-bound consent.
                </li>
                <li>
                  <strong>Author access:</strong> Records you authored yourself remain visible to you regardless of
                  consent status.
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
