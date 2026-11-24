import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { PHARMACY_LINKS } from "./pharmacy-links";

export default async function PharmacyPage() {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  async function handleSearch(formData: FormData) {
    "use server";
    const code = String(formData.get("code") || "").trim().toUpperCase();
    if (code) {
      redirect(`/pharmacy/rx/${encodeURIComponent(code)}`);
    }
  }

  return (
    <>
      <TopBar name={user.name} links={PHARMACY_LINKS} />
      <main className="landing">
        <PageHead kicker="Pharmacy counter" title="Find a prescription" />

        <div className="container dashboard">
          <div className="auth-layout">
            <form action={handleSearch} className="form-card">
              <label className="label">
                Share code
                <span className="field-hint">The 6-character code the patient shows you, for example ABC12D</span>
                <input name="code" maxLength={10} required autoComplete="off" className="input input-code" />
              </label>
              <div className="form-actions">
                <button type="submit" className="btn btn-accent btn-large">
                  Find prescription
                </button>
              </div>
            </form>

            <aside className="help-panel" aria-label="How it works">
              <h2>How it works</h2>
              <ul>
                <li>You see only the medicines, the prescribing doctor and the patient&apos;s name.</li>
                <li>Mark the prescription as dispensed after handing over the medicines.</li>
                <li>A prescription can be dispensed only once, and not after it expires.</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
