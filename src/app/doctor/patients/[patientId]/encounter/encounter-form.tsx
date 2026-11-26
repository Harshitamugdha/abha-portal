"use client";

import { useState } from "react";
import Link from "next/link";
import { createEncounter } from "@/app/actions/clinical";
import type { RecordDTO } from "@/contracts/records";
import { formatIST } from "@/contracts/format";

type InstitutionChoice = {
  id: string;
  name: string;
};

type EncounterFormProps = {
  patientId: string;
  patientName: string;
  institutions: InstitutionChoice[];
};

export function EncounterForm({
  patientId,
  patientName,
  institutions,
}: EncounterFormProps) {
  // Default occurredAt to current time in IST (YYYY-MM-DDTHH:mm)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  const defaultDateStr = istTime.toISOString().slice(0, 16);

  const [title, setTitle] = useState("");
  const [occurredAt, setOccurredAt] = useState(defaultDateStr);
  const [summary, setSummary] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<RecordDTO | null>(null);

  const hasMultipleInstitutions = institutions.length > 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFieldErrors({ title: "Title is required" });
      return;
    }

    if (!occurredAt) {
      setFieldErrors({ occurredAt: "Date is required" });
      return;
    }

    setIsPending(true);
    try {
      const res = await createEncounter({
        patientId,
        title: trimmedTitle,
        summary: summary.trim() || undefined,
        occurredAt,
        institutionId: hasMultipleInstitutions ? institutionId || undefined : undefined,
      });

      if (!res.ok) {
        if (res.error.code === "CONSENT_REQUIRED") {
          setFormError(
            "Consent required: You do not have active consent to record clinical visits for this patient.",
          );
        } else if (res.error.code === "VALIDATION_FAILED") {
          setFormError(res.error.message || "Validation failed on the encounter details.");
        } else {
          setFormError(res.error.message || "Failed to record encounter.");
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
        <span className="badge badge-success mb-3 font-semibold">Encounter Recorded</span>
        <h2 className="text-2xl font-bold text-emerald-950 mb-2">Clinical Visit Saved</h2>
        <p className="text-sm text-emerald-900 mb-6">
          The consultation note for <strong>{patientName}</strong> has been recorded to the electronic health record.
        </p>

        <div className="p-6 bg-white border border-emerald-300 rounded text-left max-w-md mx-auto space-y-3 mb-6 text-slate-800 shadow-sm">
          <p>
            <strong className="text-gray-600">Title:</strong> {result.title}
          </p>
          <p>
            <strong className="text-gray-600">Date & time:</strong> {formatIST(result.occurredAt)}
          </p>
          <p>
            <strong className="text-gray-600">Hospital:</strong> {result.institutionName}
          </p>
          <p>
            <strong className="text-gray-600">Doctor:</strong> {result.authorName || "You"}
          </p>
          {result.summary && (
            <div>
              <strong className="text-gray-600">Clinical summary:</strong>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{result.summary}</p>
            </div>
          )}
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
              setTitle("");
              setSummary("");
            }}
            className="btn btn-secondary btn-large"
          >
            Record another visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {formError && (
        <div className="alert-panel mb-6" role="alert">
          <p className="error font-medium mb-1">Encounter Error</p>
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
              Hospital / Clinic <span className="text-red-600">*</span>
            </label>
            <p className="field-hint">Select the institution where this consultation took place</p>
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

        {/* Title */}
        <div className="field">
          <label htmlFor="title" className="label font-bold text-gray-900">
            Visit title / Chief reason <span className="text-red-600">*</span>
          </label>
          <p className="field-hint">e.g. OPD Consultation: fever and body ache, Cardiology Follow-up</p>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. OPD consultation: follow-up evaluation"
            maxLength={200}
            className="input w-full"
            required
          />
          {fieldErrors.title && (
            <p className="error text-xs mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* Date / Time in IST */}
        <div className="field">
          <label htmlFor="occurredAt" className="label font-bold text-gray-900">
            Consultation date & time (IST) <span className="text-red-600">*</span>
          </label>
          <p className="field-hint">Indian Standard Time when the visit occurred</p>
          <input
            id="occurredAt"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="input"
            required
          />
          {fieldErrors.occurredAt && (
            <p className="error text-xs mt-1">{fieldErrors.occurredAt}</p>
          )}
        </div>

        {/* Clinical Summary */}
        <div className="field">
          <label htmlFor="summary" className="label font-bold text-gray-900">
            Clinical notes / Findings & remarks (optional)
          </label>
          <p className="field-hint">Clinical examination findings, diagnosis, vitals, or advice (max 2000 chars)</p>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="e.g. Patient presents with no active complaints. Blood pressure 120/80 mmHg. Advised continued diet modification and review in 3 months."
            className="input w-full"
          />
          {fieldErrors.summary && (
            <p className="error text-xs mt-1">{fieldErrors.summary}</p>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-accent btn-large"
          >
            {isPending ? "Saving encounter..." : "Record encounter"}
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
