import { PublicNav } from "@/components/ui/public-nav";
import { StaffLoginForm } from "./staff-login-form";

export default function StaffLoginPage() {
  return (
    <>
      <PublicNav />
      <main className="auth-page band">
        <div className="container">
          <p className="step-label">Doctors, labs, pharmacies and administrators</p>
          <h1 className="auth-title">Staff login</h1>
          <div className="auth-layout">
            <StaffLoginForm />
            <aside className="help-panel" aria-label="Help">
              <h2>Before you log in</h2>
              <ul>
                <li>Use the work email you registered with.</li>
                <li>A new account works only after an administrator has verified it.</li>
                <li>Forgotten your password? Ask your institution&apos;s administrator.</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
