"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

const METHODS = {
  number: {
    tab: "ABHA number",
    label: "ABHA number",
    hint: "14 digits, for example 91-1000-0000-0001",
    inputMode: "numeric" as const,
  },
  address: {
    tab: "ABHA address",
    label: "ABHA address",
    hint: "For example asha.verma@abdm",
    inputMode: "email" as const,
  },
};

type Method = "number" | "address";

export function AbhaLoginForm() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("number");
  const [abha, setAbha] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const current = METHODS[method];

  function chooseMethod(next: Method) {
    setMethod(next);
    setAbha("");
    setError("");
  }

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
    <div>
      <div className="tabs" role="group" aria-label="Log in with">
        <button
          type="button"
          className="tab"
          aria-pressed={method === "number"}
          onClick={() => chooseMethod("number")}
        >
          {METHODS.number.tab}
        </button>
        <button
          type="button"
          className="tab"
          aria-pressed={method === "address"}
          onClick={() => chooseMethod("address")}
        >
          {METHODS.address.tab}
        </button>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label className="label">
          {current.label}
          <span className="field-hint">{current.hint}</span>
          <input
            className="input input-wide"
            value={abha}
            onChange={(event) => setAbha(event.target.value)}
            inputMode={current.inputMode}
            autoComplete="username"
            required
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button className="btn btn-accent btn-large" type="submit" disabled={sending}>
            {sending ? "Sending OTP…" : "Send OTP"}
          </button>
        </div>

        <p className="form-footer">
          Doctor, lab, pharmacy or admin?{" "}
          <Link className="accent-link" href="/staff/login">
            Staff login
          </Link>
        </p>
      </form>
    </div>
  );
}
