import Link from "next/link";
import { AuthHelp, AuthShell } from "@/components/ui/auth-art";
import { PublicNav } from "@/components/ui/public-nav";
import { OtpForm } from "./otp-form";

function text(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }
  return "";
}

export default async function OtpPage(props: PageProps<"/login/otp">) {
  const searchParams = await props.searchParams;
  const txnId = text(searchParams.txn);

  return (
    <>
      <PublicNav />
      <main className="auth-page band">
        <div className="container">
          <AuthShell art="patient" caption="Your health records in one place. Doctors see them only when you say yes.">
            <p className="step-label">Step 2 of 2</p>
            <h1 className="auth-title">Enter the OTP</h1>

            {!txnId && (
              <div className="form-card">
                <p>Your login has expired.</p>
                <Link className="btn btn-accent" href="/login">
                  Start again
                </Link>
              </div>
            )}

            {txnId && (
              <>
                <OtpForm
                  firstTxnId={txnId}
                  maskedMobile={text(searchParams.mobile)}
                  abha={text(searchParams.abha)}
                  firstDevOtp={text(searchParams.dev)}
                />
                <AuthHelp title="Didn't get the OTP?">
                  <ul>
                    <li>It can take up to a minute to arrive. Check your spam folder too.</li>
                    <li>You can ask for a new one after 30 seconds.</li>
                    <li>The OTP works for 5 minutes and only once.</li>
                  </ul>
                </AuthHelp>
              </>
            )}
          </AuthShell>
        </div>
      </main>
    </>
  );
}
