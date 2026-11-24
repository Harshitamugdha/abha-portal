import Link from "next/link";
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
          <p className="step-label">Step 2 of 2</p>
          <h1 className="auth-title">Enter the OTP</h1>

          {!txnId && (
            <div className="form-card auth-narrow">
              <p>Your login has expired.</p>
              <Link className="btn btn-accent" href="/login">
                Start again
              </Link>
            </div>
          )}

          {txnId && (
            <div className="auth-layout">
              <OtpForm
                firstTxnId={txnId}
                maskedMobile={text(searchParams.mobile)}
                abha={text(searchParams.abha)}
                firstDevOtp={text(searchParams.dev)}
              />
              <aside className="help-panel" aria-label="Help">
                <h2>Didn&apos;t get the OTP?</h2>
                <ul>
                  <li>It can take up to a minute to arrive.</li>
                  <li>You can ask for a new one after 30 seconds.</li>
                  <li>The OTP works for 5 minutes and only once.</li>
                </ul>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
