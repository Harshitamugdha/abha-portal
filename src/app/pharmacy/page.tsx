import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";

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
      <TopBar name={user.name} links={[{ href: "/pharmacy", label: "Lookup" }]} />
      <main className="page">
        <h1>Pharmacy Dispense Counter</h1>
        <div className="card">
          <p className="muted" style={{ marginBottom: "16px" }}>
            Enter the patient&apos;s 6-character prescription share code to look up and dispense medications.
          </p>
          <form action={handleSearch} className="form">
            <label className="label">
              Prescription Share Code
              <input
                name="code"
                placeholder="e.g. ASHA7K"
                maxLength={10}
                required
                className="input"
                style={{ textTransform: "uppercase", letterSpacing: "2px", fontWeight: "bold" }}
              />
            </label>
            <div className="row">
              <button type="submit" className="btn">
                Look up Prescription
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            <strong>Demo Tip:</strong> Use seeded share code <code>ASHA7K</code> to test Asha&apos;s prescription.
          </p>
        </div>
      </main>
    </>
  );
}
