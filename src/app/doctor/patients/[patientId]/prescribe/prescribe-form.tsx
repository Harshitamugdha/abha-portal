"use client";

import { useState } from "react";
import Link from "next/link";
import { createPrescription } from "@/app/actions/clinical";
import { PrescriptionCreate } from "@/contracts/clinical";

type InstitutionChoice = {
  id: string;
  name: string;
};

type PrescribeFormProps = {
  patientId: string;
  patientName: string;
  institutions: InstitutionChoice[];
};

type DrugRow = {
  id: string;
  drug: string;
  dose: string;
  frequency: string;
  durationDays: number | string;
  notes: string;
};

function createInitialRow(): DrugRow {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    drug: "",
    dose: "1 tablet",
    frequency: "Once a day",
    durationDays: 7,
    notes: "",
  };
}

export function PrescribeForm({
  patientId,
  patientName,
  institutions,
}: PrescribeFormProps) {
  const [rows, setRows] = useState<DrugRow[]>([createInitialRow()]);
  const [notes, setNotes] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{ recordId: string; shareCode: string } | null>(null);

  const hasMultipleInstitutions = institutions.length > 1;

  function addRow() {
    if (rows.length >= 10) return;
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        drug: "",
        dose: "1 tablet",
        frequency: "Once a day",
        durationDays: 7,
        notes: "",
      },
    ]);
  }

  function removeRow(id: string) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow<K extends keyof Omit<DrugRow, "id">>(id: string, field: K, value: DrugRow[K]) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const payload = {
      patientId,
      institutionId: hasMultipleInstitutions ? institutionId || undefined : undefined,
      items: rows.map((r) => ({
        drug: r.drug.trim(),
        dose: r.dose.trim(),
        frequency: r.frequency.trim(),
        durationDays: Number(r.durationDays),
        notes: r.notes.trim() || undefined,
      })),
      notes: notes.trim() || undefined,
    };

    // Client-side validation with PrescriptionCreate
    const parsed = PrescriptionCreate.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path.join(".");
        if (!errors[pathKey]) {
          errors[pathKey] = issue.message;
        }
      }
      setFieldErrors(errors);
      setFormError("Please correct the errors in the medication list below.");
      return;
    }

    setIsPending(true);
    try {
      const res = await createPrescription(payload);

      if (!res.ok) {
        if (res.error.code === "CONSENT_REQUIRED") {
          setFormError(
            "Consent required: You do not have an active consent to write prescriptions for this patient.",
          );
        } else if (res.error.code === "VALIDATION_FAILED") {
          setFormError(res.error.message || "Validation failed on the submitted prescription.");
        } else {
          setFormError(res.error.message || "Failed to create prescription.");
        }
        return;
      }

      setResult(res.data);
    } catch {
      setFormError("An unexpected network error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  if (result) {
    return (
      <div className="card text-center p-8 bg-emerald-50 border-2 border-emerald-400 rounded-lg">
        <span className="badge badge-success mb-3 font-semibold">Prescription Issued</span>
        <h2 className="text-2xl font-bold text-emerald-950 mb-2">Prescription Created Successfully</h2>
        <p className="text-sm text-emerald-900 mb-6">
          A prescription for <strong>{patientName}</strong> has been recorded and is valid for 30 days.
        </p>

        <div className="my-6 p-6 bg-white border-2 border-dashed border-emerald-500 rounded-lg inline-block shadow-sm">
          <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2">Prescription Share Code</p>
          <div
            className="text-5xl md:text-6xl font-mono font-extrabold tracking-widest text-emerald-700 select-all"
            data-testid="share-code"
          >
            {result.shareCode}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Give this 6-character code to the patient or pharmacy to dispense.
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <Link
            href={`/doctor/patients/${encodeURIComponent(patientId)}`}
            className="btn btn-primary btn-large inline-block"
          >
            ← Return to patient viewer
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setRows([createInitialRow()]);
              setNotes("");
            }}
            className="btn btn-secondary btn-large"
          >
            Write another prescription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {formError && (
        <div className="alert-panel mb-6" role="alert">
          <p className="error font-medium mb-1">Prescription Error</p>
          <p className="text-sm text-gray-700">{formError}</p>
          {formError.includes("Consent required") && (
            <div className="mt-3">
              <Link
                href={`/doctor/patients/${encodeURIComponent(patientId)}/request-consent`}
                className="text-xs text-amber-900 underline font-semibold"
              >
                → Go to Request Consent form
              </Link>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card space-y-6">
        {hasMultipleInstitutions && (
          <div className="field">
            <label htmlFor="institutionSelect" className="label font-bold text-gray-900">
              Prescribing institution <span className="text-red-600">*</span>
            </label>
            <p className="field-hint">Select the hospital you are prescribing on behalf of</p>
            <select
              id="institutionSelect"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="input input-wide"
              required
            >
              <option value="">-- Choose hospital --</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Dynamic Drug Rows */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Prescription Medicines</h2>
              <p className="field-hint">Add 1 to 10 prescribed medications for {patientName}</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {rows.length} / 10 medicines
            </span>
          </div>

          {rows.map((row, index) => {
            const drugKey = `items.${index}.drug`;
            const doseKey = `items.${index}.dose`;
            const freqKey = `items.${index}.frequency`;
            const durationKey = `items.${index}.durationDays`;

            return (
              <div
                key={row.id}
                className="card p-4 border border-slate-200 bg-slate-50 relative rounded"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm text-slate-800">
                    Medicine #{index + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold"
                      aria-label={`Remove medicine #${index + 1}`}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drug Name */}
                  <div className="field">
                    <label className="label text-xs font-medium text-gray-700">
                      Medicine / Drug name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={row.drug}
                      onChange={(e) => updateRow(row.id, "drug", e.target.value)}
                      placeholder="e.g. Paracetamol 650 mg"
                      className="input w-full"
                      required
                    />
                    {fieldErrors[drugKey] && (
                      <p className="error text-xs mt-1">{fieldErrors[drugKey]}</p>
                    )}
                  </div>

                  {/* Dosage */}
                  <div className="field">
                    <label className="label text-xs font-medium text-gray-700">
                      Dosage <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={row.dose}
                      onChange={(e) => updateRow(row.id, "dose", e.target.value)}
                      placeholder="e.g. 1 tablet, 5 ml"
                      className="input w-full"
                      required
                    />
                    {fieldErrors[doseKey] && (
                      <p className="error text-xs mt-1">{fieldErrors[doseKey]}</p>
                    )}
                  </div>

                  {/* Frequency */}
                  <div className="field">
                    <label className="label text-xs font-medium text-gray-700">
                      Frequency <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={row.frequency}
                      onChange={(e) => updateRow(row.id, "frequency", e.target.value)}
                      placeholder="e.g. Twice daily, Once at bedtime"
                      className="input w-full"
                      required
                    />
                    {fieldErrors[freqKey] && (
                      <p className="error text-xs mt-1">{fieldErrors[freqKey]}</p>
                    )}
                  </div>

                  {/* Duration in Days */}
                  <div className="field">
                    <label className="label text-xs font-medium text-gray-700">
                      Duration (days: 1–90) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={row.durationDays}
                      onChange={(e) => updateRow(row.id, "durationDays", e.target.value)}
                      className="input w-full"
                      required
                    />
                    {fieldErrors[durationKey] && (
                      <p className="error text-xs mt-1">{fieldErrors[durationKey]}</p>
                    )}
                  </div>
                </div>

                {/* Optional Instructions */}
                <div className="field mt-3">
                  <label className="label text-xs font-medium text-gray-700">
                    Instructions / Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                    placeholder="e.g. Take after food, do not crush"
                    className="input w-full"
                  />
                </div>
              </div>
            );
          })}

          {rows.length < 10 && (
            <button
              type="button"
              onClick={addRow}
              className="btn btn-secondary btn-small w-full"
            >
              + Add another medicine ({10 - rows.length} remaining)
            </button>
          )}
        </div>

        {/* Overall Clinical Notes */}
        <div className="field">
          <label htmlFor="notes" className="label font-bold text-gray-900">
            Clinical advice / Doctor remarks (optional)
          </label>
          <p className="field-hint">Any dietary recommendations or follow-up notes (max 500 characters)</p>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Review blood pressure after 2 weeks. Drink plenty of water."
            className="input w-full"
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-accent btn-large"
          >
            {isPending ? "Issuing prescription..." : "Issue prescription"}
          </button>
          <Link
            href={`/doctor/patients/${encodeURIComponent(patientId)}`}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
