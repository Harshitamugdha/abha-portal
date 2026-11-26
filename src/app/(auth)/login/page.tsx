import { AuthHelp, AuthShell } from "@/components/ui/auth-art";
import { PublicNav } from "@/components/ui/public-nav";
import { AbhaLoginForm } from "./abha-login-form";

export default function AbhaLoginPage() {
  return (
    <>
      <PublicNav />
      <main className="auth-page band">
        <div className="container">
          <AuthShell art="patient" caption="Your health records in one place. Doctors see them only when you say yes.">
            <p className="step-label">Step 1 of 2</p>
            <h1 className="auth-title">Log in with your ABHA</h1>
            <AbhaLoginForm />
            <AuthHelp title="Before you start">
              <ul>
                <li>Your ABHA number is the 14-digit number on your ABHA card.</li>
                <li>We send a one-time password (OTP) to the mobile number linked to your ABHA.</li>
                <li>Never share your OTP with anyone, including hospital staff.</li>
              </ul>
            </AuthHelp>
          </AuthShell>
        </div>
      </main>
    </>
  );
}
