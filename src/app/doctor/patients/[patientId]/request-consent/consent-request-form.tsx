"use client";

import { useState } from "react";
import Link from "next/link";
import { requestConsent } from "@/app/actions/consent";
import type { ConsentDTO } from "@/contracts/consent";
import { ConsentRequest } from "@/contracts/consent";
import type { RecordType } from "@/contracts/shared";
import { buildConsentRequest } from "./form-helper";

type InstitutionChoice = {
  id: string;
  name: string;
};

type ConsentRequestFormProps = {
  patientId: string;
  patientName: string;
  institutions: InstitutionChoice[];
  existingOpenRequest: ConsentDTO | null;
};

const ALL_SCOPES: Array<{ type: RecordType; label: string; desc: string }> = [
  { type: "ENCOUNTER", label: "Visits & Encounters", desc: "Outpatient and inpatient consultation notes" },
  { type: "PRESCRIPTION", label: "Prescriptions", desc: "Prescribed medicines, dosages, and share codes" },
  { type: "LAB_REPORT", label: "Lab reports", desc: "Blood tests, panels, pathology, and diagnostic results" },
  { type: "DOCUMENT", label: "Documents", desc: "Uploaded clinical files, discharge summaries, and scans" },
];

export function ConsentRequestForm({
  patientId,
  patientName,
  institutions,
  existingOpenRequest,
}: ConsentRequestFormProps) {
  const [scopes, setScopes] = useState<RecordType[]>(["PRESCRIPTION", "LAB_REPORT"]);
  const [durationDays, setDurationDays] = useState<number | string>(7);
  const [purpose, setPurpose] = useState("");
  const [institutionId, setInstitutionId] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{
    consent: ConsentDTO;
    isExisting: boolean;
  } | null>(null);

  const hasMultipleInstitutions = institutions.length > 1;

  function toggleScope(scope: RecordType) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // Build plain object payload using pure helper
    const payload = buildConsentRequest({
      patientId,
      scopes,
      purpose,
      durationDays,
      institutionId: hasMultipleInstitutions ? institutionId : undefined,
    });

    // Client-side validation with ConsentRequest schema
    const parsed = ConsentRequest.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "form");
        if (!errors[key]) {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setIsPending(true);
    try {
      // Call Harshita's action with a plain object
      const res = await requestConsent(payload);

      if (!res.ok) {
        if (res.error.code === "VALIDATION_FAILED") {
          const details = res.error.details as
            | { fieldErrors?: Record<string, string[]> }
            | undefined;
          if (details?.fieldErrors) {
            const errors: Record<string, string> = {};
            for (const [key, msgs] of Object.entries(details.fieldErrors)) {
              if (msgs && msgs.length > 0) {
                errors[key] = msgs[0];
              }
            }
            setFieldErrors(errors);
          } else {
            setFormError(res.error.message);
          }
        } else if (res.error.code === "CONFLICT") {
          setFormError(res.error.message || "A consent request or active grant already exists for this patient.");
        } else {
          setFormError(res.error.message || "Failed to submit consent request.");
        }
        return;
      }

      // Check if the returned consent is an already open request
      const isAlreadyOpen =
        existingOpenRequest?.id === res.data.id ||
        new Date().getTime() - new Date(res.data.requestedAt).getTime() > 4000;

      setResult({
        consent: res.data,
        isExisting: isAlreadyOpen,
      });
    } catch {
      setFormError("An unexpected error occurred while communicating with the server.");
    } finally {
      setIsPending(false);
    }
  }

  if (result) {
    return (
      <div className="card p-6 border-l-4 border-emerald-500 bg-emerald-50 text-emerald-950">
        <h2 className="text-xl font-bold text-emerald-900 mb-2">
          {result.isExisting ? "Request Already Open" : "Waiting for the patient"}
        </h2>
        <p className="text-sm text-emerald-900 mb-4">
          {result.isExisting
            ? `A request for ${patientName} is already open and waiting for their approval.`
            : `Waiting for the patient. Your access request has been sent to ${patientName}. Once approved, records will appear in your viewer.`}
        </p>

        <div className="p-4 bg-white border border-emerald-200 rounded text-sm space-y-2 mb-6 text-slate-800">
          <p>
            <strong>Requested scopes:</strong> {result.consent.scopes.join(", ")}
          </p>
          <p>
            <strong>Duration:</strong> {result.consent.durationDays} days
          </p>
          <p>
            <strong>Purpose:</strong> {result.consent.purpose}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className="badge badge-amber font-semibold">Waiting for patient decision</span>
          </p>
        </div>

        <Link
          href={`/doctor/patients/${encodeURIComponent(patientId)}`}
          className="btn btn-accent btn-large inline-block"
        >
          ← Back to patient records
        </Link>
      </div>
    );
  }

  return (
    <div>
      {existingOpenRequest && (
        <div className="alert-panel mb-6" role="status" style={{ borderLeftColor: "var(--amber, #d97706)" }}>
          <p className="font-semibold text-amber-900 mb-1">Request already open</p>
          <p className="text-sm text-amber-800 mb-2">
            You already have an open request waiting for {patientName} (purpose: &quot;{existingOpenRequest.purpose}&quot;).
            Submitting again will not create a duplicate.
          </p>
          <Link
            href={`/doctor/patients/${encodeURIComponent(patientId)}`}
            className="text-xs text-amber-900 underline font-medium"
          >
            ← Return to patient viewer
          </Link>
        </div>
      )}

      {formError && (
        <div className="alert-panel mb-6" role="alert">
          <p className="error font-medium mb-1">Request error</p>
          <p className="text-sm text-gray-700">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card space-y-6">
        {/* Scopes */}
        <fieldset className="border-0 p-0 m-0">
          <legend className="label font-bold text-gray-900 mb-1">
            Record types requested (at least one)
          </legend>
          <p className="field-hint mb-3">Choose the clinical scopes you need access to view</p>

          <div className="space-y-3">
            {ALL_SCOPES.map((scope) => {
              const isChecked = scopes.includes(scope.type);
              return (
                <label
                  key={scope.type}
                  className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                    isChecked ? "bg-blue-50 border-blue-400" : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleScope(scope.type)}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900 block text-sm">{scope.label}</span>
                    <span className="text-xs text-gray-500">{scope.desc}</span>
                  </div>
                </label>
              );
            })}
          </div>
          {fieldErrors.scopes && (
            <p className="field-error text-red-600 text-xs mt-2">{fieldErrors.scopes}</p>
          )}
        </fieldset>

        {/* Duration */}
        <label className="label block">
          Access duration (days)
          <span className="field-hint">Between 1 and 30 days (default: 7)</span>
          <input
            type="number"
            min="1"
            max="30"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="input"
            required
          />
          {fieldErrors.durationDays && (
            <p className="field-error text-red-600 text-xs mt-1">{fieldErrors.durationDays}</p>
          )}
        </label>

        {/* Purpose */}
        <label className="label block">
          Clinical purpose
          <span className="field-hint">Explain why you need this access (3 to 120 characters)</span>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Follow-up consultation"
            maxLength={120}
            className="input"
            required
          />
          {fieldErrors.purpose && (
            <p className="field-error text-red-600 text-xs mt-1">{fieldErrors.purpose}</p>
          )}
        </label>

        {/* Multi-institution select (only when doctor belongs to > 1 institution, Part C) */}
        {hasMultipleInstitutions && (
          <label className="label block">
            Institution requesting for
            <span className="field-hint">You practice at multiple institutions; select which one</span>
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="input"
              required
            >
              <option value="">-- Choose institution --</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            {fieldErrors.institutionId && (
              <p className="field-error text-red-600 text-xs mt-1">{fieldErrors.institutionId}</p>
            )}
          </label>
        )}

        {/* Submit actions */}
        <div className="form-actions row" style={{ gap: "12px", alignItems: "center" }}>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-accent btn-large"
          >
            {isPending ? "Sending request…" : "Send access request"}
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
