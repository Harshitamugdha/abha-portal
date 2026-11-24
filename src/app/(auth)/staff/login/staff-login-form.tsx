"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

export function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/v1/auth/staff/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email, password: password }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body.error.message);
        return;
      }
      router.push(body.redirectTo);
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <label className="label">
        Work email
        <input
          className="input input-wide"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <label className="label">
        Password
        <input
          className="input input-wide"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button className="btn btn-accent btn-large" type="submit" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </div>

      <p className="form-footer">
        New here?{" "}
        <Link className="accent-link" href="/staff/register">
          Register as staff
        </Link>
        <span className="link-divider" aria-hidden="true">
          |
        </span>
        Patient?{" "}
        <Link className="accent-link" href="/login">
          Log in with ABHA
        </Link>
      </p>
    </form>
  );
}
