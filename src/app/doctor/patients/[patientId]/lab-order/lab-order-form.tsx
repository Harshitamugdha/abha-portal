"use client";

import { useState } from "react";
import Link from "next/link";
import { createLabOrder } from "@/app/actions/clinical";
import { LabOrderCreate } from "@/contracts/clinical";
import type { LabOrderDTO } from "@/contracts/lab";
import type { InstitutionChoice } from "@/server/records/institutions";

type LabOrderFormProps = {
  patientId: string;
  patientName: string;
  labs: InstitutionChoice[];
};

type TestRow = {
  id: string;
  name: string;
};

const COMMON_TESTS = [
  "HbA1c",
  "Complete Blood Count (CBC)",
  "Lipid Profile",
  "Thyroid Profile (T3, T4, TSH)",
  "Liver Function Test (LFT)",
  "Kidney Function Test (KFT)",
  "Fasting Blood Sugar",
];

function createInitialTestRow(initialName = ""): TestRow {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: initialName,
  };
}

export function LabOrderForm({
  patientId,
  patientName,
  labs,
}: LabOrderFormProps) {
  const [labInstitutionId, setLabInstitutionId] = useState(
    labs.length === 1 ? labs[0].id : "",
  );
  const [tests, setTests] = useState<TestRow[]>([createInitialTestRow("HbA1c")]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<LabOrderDTO | null>(null);

  function addTest(name = "") {
    if (tests.length >= 10) return;
    setTests((prev) => [...prev, createInitialTestRow(name)]);
  }

  function removeTest(id: string) {
    if (tests.length <= 1) return;
    setTests((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTest(id: string, name: string) {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t)),
    );
  }

  function handleQuickAdd(testName: string) {
    const existingEmpty = tests.find((t) => !t.name.trim());
    if (existingEmpty) {
      updateTest(existingEmpty.id, testName);
    } else if (tests.length < 10) {
      addTest(testName);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const trimmedTests = tests.map((t) => t.name.trim()).filter(Boolean);

    const payload = {
      patientId,
      labInstitutionId,
      tests: trimmedTests,
    };

    // Client-side validation with LabOrderCreate
    const parsed = LabOrderCreate.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path.join(".");
        if (!errors[pathKey]) {
          errors[pathKey] = issue.message;
        }
      }
      setFieldErrors(errors);
      setFormError("Please correct the errors in the lab order below.");
      return;
    }

    setIsPending(true);
    try {
      const res = await createLabOrder(payload);

      if (!res.ok) {
        if (res.error.code === "CONSENT_REQUIRED") {
          setFormError(
            "Consent required: You do not have active consent to place lab orders for this patient.",
          );
        } else if (res.error.code === "VALIDATION_FAILED") {
          setFormError(res.error.message || "Validation failed on the submitted lab order.");
        } else {
          setFormError(res.error.message || "Failed to create lab order.");
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
        <span className="badge badge-success mb-3 font-semibold">Lab Order Placed</span>
        <h2 className="text-2xl font-bold text-emerald-950 mb-2">Diagnostic Order Created</h2>
        <p className="text-sm text-emerald-900 mb-6">
          The diagnostic request for <strong>{patientName}</strong> has been transmitted to{" "}
          <strong>{result.labInstitutionName}</strong>.
        </p>

        <div className="p-6 bg-white border border-emerald-300 rounded text-left max-w-md mx-auto space-y-3 mb-6 text-slate-800 shadow-sm">
          <p>
            <strong className="text-gray-600">Order ID:</strong>{" "}
            <span className="font-mono text-sm">{result.id}</span>
          </p>
          <p>
            <strong className="text-gray-600">Laboratory:</strong> {result.labInstitutionName}
          </p>
          <p>
            <strong className="text-gray-600">Tests ordered:</strong>
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {result.tests.map((t, idx) => (
              <li key={idx} className="font-medium text-slate-900">
                {t}
              </li>
            ))}
          </ul>
          <p>
            <strong className="text-gray-600">Status:</strong>{" "}
            <span className="badge badge-amber font-semibold">{result.status}</span>
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
              setTests([createInitialTestRow()]);
            }}
            className="btn btn-secondary btn-large"
          >
            Order another test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {formError && (
        <div className="alert-panel mb-6" role="alert">
          <p className="error font-medium mb-1">Lab Order Error</p>
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
        {/* Lab Picker */}
        <div className="field">
          <label htmlFor="labSelect" className="label font-bold text-gray-900">
            Fulfilling diagnostic laboratory
          </label>
          <p className="field-hint">Choose the diagnostic lab to fulfil these tests</p>
          <select
            id="labSelect"
            value={labInstitutionId}
            onChange={(e) => setLabInstitutionId(e.target.value)}
            className="input input-wide"
            required
          >
            <option value="">-- Choose laboratory --</option>
            {labs.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name} ({lab.city})
              </option>
            ))}
          </select>
          {fieldErrors.labInstitutionId && (
            <p className="error text-xs mt-1">{fieldErrors.labInstitutionId}</p>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <p className="label">Common diagnostic panels:</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_TESTS.map((testName) => (
              <button
                key={testName}
                type="button"
                onClick={() => handleQuickAdd(testName)}
                className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2.5 py-1 text-slate-700 transition-colors"
              >
                + {testName}
              </button>
            ))}
          </div>
        </div>

        {/* Tests List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Requested Tests (1 to 10)</h2>
              <p className="field-hint">Specify the diagnostic investigations required</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {tests.length} / 10 tests
            </span>
          </div>

          {tests.map((testRow, idx) => (
            <div key={testRow.id} className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 w-6">#{idx + 1}</span>
              <input
                type="text"
                value={testRow.name}
                onChange={(e) => updateTest(testRow.id, e.target.value)}
                placeholder="e.g. HbA1c, Complete blood count"
                className="input flex-1"
                required
              />
              {tests.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTest(testRow.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1"
                  aria-label={`Remove test #${idx + 1}`}
                >
                  ✕ Remove
                </button>
              )}
            </div>
          ))}

          {fieldErrors.tests && (
            <p className="error text-xs mt-1">{fieldErrors.tests}</p>
          )}

          {tests.length < 10 && (
            <button
              type="button"
              onClick={() => addTest()}
              className="btn btn-secondary btn-small w-full mt-2"
            >
              + Add another test ({10 - tests.length} remaining)
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-accent btn-large"
          >
            {isPending ? "Submitting order..." : "Place lab order"}
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
