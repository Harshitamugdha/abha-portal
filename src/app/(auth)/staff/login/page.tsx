"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const response = await fetch("/api/v1/auth/staff/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    });
    const body = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(body.error.message);
      return;
    }
    router.push(body.redirectTo);
    router.refresh();
  }

  return (
    <main className="page">
      <h1>Staff login</h1>
      <form className="form card" onSubmit={handleSubmit}>
        <label className="label">
          Email
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="label">
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          Log in
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="muted">
        New here?{" "}
        <Link className="link" href="/staff/register">
          Register as staff
        </Link>{" "}
        · Patient?{" "}
        <Link className="link" href="/login">
          Log in with ABHA
        </Link>
      </p>
    </main>
  );
}
