"use client";

import { useState } from "react";
import Link from "next/link";
import { registerStaff } from "./actions";

type Institution = {
  id: string;
  name: string;
  type: string;
};

const INSTITUTION_TYPE_FOR_ROLE: Record<string, string> = {
  DOCTOR: "HOSPITAL",
  PHARMACY: "PHARMACY",
  LAB: "LAB",
};

export function RegisterForm({ institutions }: { institutions: Institution[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DOCTOR");
  const [institutionId, setInstitutionId] = useState("");
  const [hprId, setHprId] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const choices: Institution[] = [];
  for (const institution of institutions) {
    if (institution.type === INSTITUTION_TYPE_FOR_ROLE[role]) {
      choices.push(institution);
    }
  }

  function changeRole(newRole: string) {
    setRole(newRole);
    setInstitutionId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const input = {
      name: name,
      email: email,
      password: password,
      role: role,
      institutionId: institutionId,
      hprId: role === "DOCTOR" ? hprId : undefined,
    };
    const result = await registerStaff(input);
    setBusy(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card">
        <p className="success">Registered. An admin must verify your account before you can log in.</p>
        <Link className="link" href="/staff/login">
          Go to staff login
        </Link>
      </div>
    );
  }

  return (
    <form className="form card" onSubmit={handleSubmit}>
      <label className="label">
        Full name
        <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
      </label>
      <label className="label">
        Email
        <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="label">
        Password (8+ characters)
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>
      <label className="label">
        Role
        <select className="input" value={role} onChange={(event) => changeRole(event.target.value)}>
          <option value="DOCTOR">Doctor</option>
          <option value="PHARMACY">Pharmacy</option>
          <option value="LAB">Lab</option>
        </select>
      </label>
      <label className="label">
        Institution
        <select className="input" value={institutionId} onChange={(event) => setInstitutionId(event.target.value)} required>
          <option value="">Choose…</option>
          {choices.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </select>
      </label>
      {role === "DOCTOR" && (
        <label className="label">
          HPR id
          <input className="input" value={hprId} onChange={(event) => setHprId(event.target.value)} required />
        </label>
      )}
      <button className="btn" type="submit" disabled={busy}>
        Register
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
