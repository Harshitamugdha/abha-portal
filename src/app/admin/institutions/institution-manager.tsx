"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInstitution, updateInstitution } from "@/app/actions/admin";
import type { InstitutionDTO } from "@/contracts/admin";
import type { InstitutionType } from "@/contracts/shared";

const TYPE_LABELS: Record<string, string> = {
  HOSPITAL: "Hospital",
  PHARMACY: "Pharmacy",
  LAB: "Lab",
};

type InstitutionManagerProps = {
  institutions: InstitutionDTO[];
};

export function InstitutionManager({ institutions }: InstitutionManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<InstitutionType>("HOSPITAL");
  const [city, setCity] = useState("");

  function clearForm() {
    setEditingId(null);
    setName("");
    setType("HOSPITAL");
    setCity("");
  }

  function startEdit(inst: InstitutionDTO) {
    setEditingId(inst.id);
    setName(inst.name);
    setType(inst.type);
    setCity(inst.city);
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  function cancelEdit() {
    clearForm();
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  async function save() {
    if (editingId) {
      const res = await updateInstitution({ id: editingId, name, type, city });
      if (res.ok) {
        clearForm();
        setSuccessMsg(res.data.name + " was updated.");
        router.refresh();
      } else {
        setErrorMsg(res.error.message || "Could not update the institution.");
      }
      return;
    }

    const res = await createInstitution({ name, type, city });
    if (res.ok) {
      clearForm();
      setSuccessMsg(res.data.name + " was added.");
      router.refresh();
    } else {
      setErrorMsg(res.error.message || "Could not add the institution.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(save);
  }

  let formTitle = "Add an institution";
  let buttonLabel = "Add institution";
  if (editingId) {
    formTitle = "Edit institution";
    buttonLabel = "Save changes";
  }
  if (isPending) {
    buttonLabel = "Saving…";
  }

  return (
    <div className="auth-layout">
      <section aria-labelledby="registered">
        <h2 id="registered" className="section-title">
          Participating institutions ({institutions.length})
        </h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>City</th>
                <th>ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => {
                const isEditing = inst.id === editingId;
                return (
                  <tr key={inst.id} className={isEditing ? "row-editing" : undefined}>
                    <td>
                      <strong>{inst.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-grey">{TYPE_LABELS[inst.type] || inst.type}</span>
                    </td>
                    <td>{inst.city}</td>
                    <td className="nowrap">
                      <code>{inst.id}</code>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => startEdit(inst)}
                        disabled={isEditing}
                        className="btn btn-secondary btn-small"
                      >
                        {isEditing ? "Editing" : "Edit"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="institution-form">
        <h2 id="institution-form" className="section-title">
          {formTitle}
        </h2>
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
              {buttonLabel}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} disabled={isPending} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
