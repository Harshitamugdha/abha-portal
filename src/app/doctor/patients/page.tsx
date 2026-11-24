import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { DOCTOR_LINKS } from "../doctor-links";

export default async function DoctorPatientsSearchPage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  async function handleSearch(formData: FormData) {
    "use server";
    const raw = String(formData.get("abha") || "").trim();
    if (raw) {
      // In Phase 0/fixtures, redirects to Asha's demo record viewer
      redirect(`/doctor/patients/${encodeURIComponent(raw)}`);
    }
  }

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead kicker="Doctor portal" title="Find a patient" />

        <div className="container dashboard">
          <div className="auth-layout">
            <form action={handleSearch} className="form-card">
              <label className="label">
                ABHA number or ABHA address
                <span className="field-hint">
                  Enter 14-digit number (e.g. 91-1000-0000-0001) or address (e.g. asha.verma@abdm)
                </span>
                <input
                  name="abha"
                  type="text"
                  placeholder="91-1000-0000-0001"
                  required
                  autoComplete="off"
                  className="input"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn btn-accent btn-large">
                  Search patient
                </button>
              </div>
            </form>

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
