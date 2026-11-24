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
        setSuccessMsg(`Successfully registered "${res.data.name}" (${res.data.id})`);
        setName("");
        setCity("");
        router.refresh();
      } else {
        setErrorMsg(res.error.message || "Failed to register institution");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="form" style={{ maxWidth: "480px" }}>
      {errorMsg && <p className="error">{errorMsg}</p>}
      {successMsg && <p className="success">{successMsg}</p>}

      <label className="label">
        Institution Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Care Diagnostic Center"
          required
          className="input"
        />
      </label>

      <label className="label">
        Institution Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as InstitutionType)}
          className="input"
        >
          <option value="HOSPITAL">HOSPITAL</option>
          <option value="PHARMACY">PHARMACY</option>
          <option value="LAB">LAB</option>
        </select>
      </label>

      <label className="label">
        City
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Bengaluru"
          required
          className="input"
        />
      </label>

      <button type="submit" disabled={isPending} className="btn" style={{ alignSelf: "flex-start", marginTop: "4px" }}>
        {isPending ? "Registering..." : "Add Institution"}
      </button>
    </form>
  );
}
