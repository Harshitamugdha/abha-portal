"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCountdown } from "./use-countdown";

type OtpFormProps = {
  firstTxnId: string;
  maskedMobile: string;
  abha: string;
  firstDevOtp: string;
};

export function OtpForm({ firstTxnId, maskedMobile, abha, firstDevOtp }: OtpFormProps) {
  const router = useRouter();
  const countdown = useCountdown(30);
  const [txnId, setTxnId] = useState(firstTxnId);
  const [devOtp, setDevOtp] = useState(firstDevOtp);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const response = await fetch("/api/v1/auth/abha/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ txnId: txnId, otp: otp }),
    });
    const body = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(body.error.message);
      return;
    }
    router.push("/patient");
    router.refresh();
  }

  async function resend() {
    setError("");
    setBusy(true);

    const response = await fetch("/api/v1/auth/abha/otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ abha: abha }),
    });
    const body = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(body.error.message);
      return;
    }
    setTxnId(body.txnId);
    setDevOtp(body.devOtp || "");
    setOtp("");
    countdown.restart();
  }

  return (
    <form className="form card" onSubmit={verify}>
      <p>We sent a 6-digit OTP to the mobile number ending {maskedMobile}.</p>
      {devOtp && <p className="hint">Demo OTP: {devOtp}</p>}
      <label className="label">
        OTP
        <input
          className="input"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          inputMode="numeric"
          maxLength={6}
          required
        />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        Verify and log in
      </button>
      <button className="btn btn-secondary" type="button" disabled={busy || countdown.left > 0} onClick={resend}>
        {countdown.left > 0 ? "Resend OTP in " + countdown.left + "s" : "Resend OTP"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
