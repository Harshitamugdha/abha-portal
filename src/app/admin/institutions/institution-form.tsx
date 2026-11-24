"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInstitution } from "@/app/actions/admin";
import type { InstitutionType } from "@/contracts/shared";

export function InstitutionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<InstitutionType>("HOSPITAL");
  const [city, setCity] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await createInstitution({ name, type, city });
      if (res.ok) {
        setSuccessMsg(res.data.name + " was added.");
        setName("");
        setCity("");
        router.refresh();
      } else {
        setErrorMsg(res.error.message || "Could not add the institution.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <label className="label">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </label>

      <label className="label">
        Type
        <select value={type} onChange={(e) => setType(e.target.value as InstitutionType)} className="input">
          <option value="HOSPITAL">Hospital</option>
          <option value="PHARMACY">Pharmacy</option>
          <option value="LAB">Lab</option>
        </select>
      </label>

      <label className="label">
        City
        <input value={city} onChange={(e) => setCity(e.target.value)} required className="input" />
      </label>

      {errorMsg && (
        <p className="error" role="alert">
          {errorMsg}
        </p>
      )}
      {successMsg && (
        <p className="success" role="status">
          {successMsg}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" disabled={isPending} className="btn btn-accent">
          {isPending ? "Adding…" : "Add institution"}
        </button>
      </div>
    </form>
  );
}
