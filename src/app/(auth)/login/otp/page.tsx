import Link from "next/link";
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

  if (!txnId) {
    return (
      <main className="page">
        <h1>Enter OTP</h1>
        <p>
          Start again from the{" "}
          <Link className="link" href="/login">
            login page
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Enter OTP</h1>
      <OtpForm
        firstTxnId={txnId}
        maskedMobile={text(searchParams.mobile)}
        abha={text(searchParams.abha)}
        firstDevOtp={text(searchParams.dev)}
      />
    </main>
  );
}
