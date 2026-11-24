"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

export default function AbhaLoginPage() {
  const router = useRouter();
  const [abha, setAbha] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/v1/auth/abha/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ abha: abha }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error.message);
        return;
      }

      const params = new URLSearchParams();
      params.set("txn", body.txnId);
      params.set("mobile", body.maskedMobile);
      params.set("abha", abha);
      if (body.devOtp) {
        params.set("dev", body.devOtp);
      }
      router.push("/login/otp?" + params.toString());
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="page">
      <div className="auth-box">
        <h1>Log in with ABHA</h1>
        <p className="lead">We will send a one-time password (OTP) to the mobile number linked to your ABHA.</p>
        <form className="form card" onSubmit={handleSubmit}>
          <label className="label">
            ABHA number or ABHA address
            <span className="field-hint">For example 91-1000-0000-0001 or name@abdm</span>
            <input
              className="input"
              value={abha}
              onChange={(event) => setAbha(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <button className="btn" type="submit" disabled={sending}>
            {sending ? "Sending OTP…" : "Send OTP"}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
        <p className="muted">
          Doctor, lab, pharmacy or admin?{" "}
          <Link className="link" href="/staff/login">
            Staff login
          </Link>
        </p>
      </div>
    </main>
  );
}
