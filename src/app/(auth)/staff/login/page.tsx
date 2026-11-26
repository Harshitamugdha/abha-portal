import { AuthHelp, AuthShell } from "@/components/ui/auth-art";
import { PublicNav } from "@/components/ui/public-nav";
import { StaffLoginForm } from "./staff-login-form";

export default function StaffLoginPage() {
  return (
    <>
      <PublicNav />
      <main className="auth-page band">
        <div className="container">
          <AuthShell art="staff" caption="See a patient's records only with their consent, and only while it lasts.">
            <p className="step-label">Doctors, labs, pharmacies and administrators</p>
            <h1 className="auth-title">Staff login</h1>
            <StaffLoginForm />
            <AuthHelp title="Before you log in">
              <ul>
                <li>Use the work email you registered with.</li>
                <li>A new account works only after an administrator has verified it.</li>
                <li>Forgotten your password? Ask your institution&apos;s administrator.</li>
              </ul>
            </AuthHelp>
          </AuthShell>
        </div>
      </main>
    </>
  );
}
