import { PublicNav } from "@/components/ui/public-nav";
import { listInstitutionsForRegistration } from "@/server/auth/register";
import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function StaffRegisterPage() {
  const institutions = await listInstitutionsForRegistration();

  return (
    <>
      <PublicNav />
      <main className="auth-page band">
        <div className="container">
          <p className="step-label">Doctors, labs and pharmacies</p>
          <h1 className="auth-title">Register as staff</h1>
          <div className="auth-layout">
            <RegisterForm institutions={institutions} />
            <aside className="help-panel" aria-label="What happens next">
              <h2>What happens next</h2>
              <ol className="help-steps">
                <li>You register here with your work details.</li>
                <li>An administrator checks your role and, for doctors, your HPR ID.</li>
                <li>Once verified, you log in with your email and password.</li>
              </ol>
              <p className="muted">Patients don&apos;t register here. They log in with their ABHA number.</p>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
