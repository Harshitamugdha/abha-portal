"use client";

import { useState } from "react";
import Link from "next/link";
import { registerStaff } from "./actions";

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

type Institution = {
  id: string;
  name: string;
  type: string;
};

const ROLES = [
  { value: "DOCTOR", label: "Doctor", detail: "Works at a hospital", institutionType: "HOSPITAL" },
  { value: "PHARMACY", label: "Pharmacy", detail: "Dispenses prescriptions", institutionType: "PHARMACY" },
  { value: "LAB", label: "Lab", detail: "Uploads test results", institutionType: "LAB" },
];

function institutionTypeFor(role: string) {
  for (const item of ROLES) {
    if (item.value === role) {
      return item.institutionType;
    }
  }
  return "";
}

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
    if (institution.type === institutionTypeFor(role)) {
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

    let doctorHprId = undefined;
    if (role === "DOCTOR") {
      doctorHprId = hprId;
    }

    try {
      const result = await registerStaff({
        name: name,
        email: email,
        password: password,
        role: role,
        institutionId: institutionId,
        hprId: doctorHprId,
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setDone(true);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="form-card success-card">
        <h2>Registration received</h2>
        <p>
          Thank you, {name}. An administrator will check your details. You can log in once your account is verified.
        </p>
        <div>
          <Link className="btn btn-accent" href="/staff/login">
            Go to staff login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <fieldset>
        <legend className="form-section">1. Your role</legend>
        <div className="role-options">
          {ROLES.map((item) => (
            <label key={item.value} className="role-option">
              <input
                type="radio"
                name="role"
                value={item.value}
                checked={role === item.value}
                onChange={() => changeRole(item.value)}
              />
              <span>
                <strong>{item.label}</strong>
                <span className="field-hint">{item.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="form-fields">
        <legend className="form-section">2. Your details</legend>
        <label className="label">
          Full name
          <input
            className="input input-wide"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="label">
          Work email
          <input
            className="input input-wide"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="label">
          Password
          <span className="field-hint">At least 8 characters</span>
          <input
            className="input input-wide"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="label">
          Where you work
          <select
            className="input input-wide"
            value={institutionId}
            onChange={(event) => setInstitutionId(event.target.value)}
            required
          >
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
            HPR ID
            <span className="field-hint">Your Healthcare Professional Registry ID</span>
            <input
              className="input input-wide"
              value={hprId}
              onChange={(event) => setHprId(event.target.value)}
              required
            />
          </label>
        )}
      </fieldset>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button className="btn btn-accent btn-large" type="submit" disabled={busy}>
          {busy ? "Registering…" : "Register"}
        </button>
      </div>

      <p className="form-footer">
        Already registered?{" "}
        <Link className="accent-link" href="/staff/login">
          Staff login
        </Link>
      </p>
    </form>
  );
}
