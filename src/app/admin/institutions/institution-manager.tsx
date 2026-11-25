"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInstitution, updateInstitution } from "@/app/actions/admin";
import type { InstitutionDTO } from "@/contracts/admin";
import type { InstitutionType } from "@/contracts/shared";

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

  function startEdit(inst: InstitutionDTO) {
    setEditingId(inst.id);
    setName(inst.name);
    setType(inst.type);
    setCity(inst.city);
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setType("HOSPITAL");
    setCity("");
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      if (editingId) {
        const res = await updateInstitution({ id: editingId, name, type, city });
        if (res.ok) {
          setSuccessMsg(`Successfully updated "${res.data.name}"`);
          cancelEdit();
          router.refresh();
        } else {
          setErrorMsg(res.error.message || "Failed to update institution");
        }
      } else {
        const res = await createInstitution({ name, type, city });
        if (res.ok) {
          setSuccessMsg(`Successfully registered "${res.data.name}" (${res.data.id})`);
          setName("");
          setCity("");
          router.refresh();
        } else {
          setErrorMsg(res.error.message || "Failed to register institution");
        }
      }
    });
  }

  return (
    <div>
      <h2>{editingId ? `Edit Institution (${editingId})` : "Register New Institution"}</h2>
      <div className="card" style={{ marginBottom: "28px" }}>
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

          <div className="row" style={{ marginTop: "4px" }}>
            <button type="submit" disabled={isPending} className="btn">
              {isPending
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Add Institution"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isPending}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <h2>Registered Institutions ({institutions.length})</h2>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>City</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map((inst) => (
              <tr key={inst.id}>
                <td><code>{inst.id}</code></td>
                <td><strong>{inst.name}</strong></td>
                <td>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background:
                        inst.type === "HOSPITAL"
                          ? "#e0e7ff"
                          : inst.type === "PHARMACY"
                          ? "#fef3c7"
                          : "#dcfce7",
                    }}
                  >
                    {inst.type}
                  </span>
                </td>
                <td>{inst.city}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => startEdit(inst)}
                    className="btn btn-secondary"
                    style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
