"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { uploadDocument } from "@/app/actions/records";
import type { InstitutionChoice } from "@/server/records/institutions";

export function UploadDocumentForm({
  institutions,
}: {
  institutions: InstitutionChoice[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    const file = formData.get("file");
    if (file instanceof Blob && file.size > 5 * 1024 * 1024) {
      setErrorMsg("The file is larger than 5 MB.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await uploadDocument(formData);
        if (res.ok) {
          router.push("/patient/records");
        } else {
          setErrorMsg(res.error.message || "Failed to upload document.");
          if (
            res.error.details &&
            typeof res.error.details === "object" &&
            "fieldErrors" in res.error.details
          ) {
            const fe = (res.error.details as { fieldErrors: Record<string, string[]> }).fieldErrors;
            setFieldErrors(fe || {});
          }
        }
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.message.toLowerCase().includes("exceeded") ||
            err.message.toLowerCase().includes("limit") ||
            err.message.toLowerCase().includes("body"))
        ) {
          setErrorMsg("The file is larger than 5 MB.");
        } else {
          setErrorMsg("The file is larger than 5 MB.");
        }
      }
    });
  }

  return (
    <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="alert-panel" role="alert">
            <p className="error font-medium">{errorMsg}</p>
          </div>
        )}

        <label className="label">
          <span>Document title</span>
          <input
            type="text"
            name="title"
            required
            placeholder="e.g. Discharge summary 2024"
            className="input"
            disabled={isPending}
          />
          {fieldErrors.title && (
            <span className="error text-xs">{fieldErrors.title[0]}</span>
          )}
        </label>

        <label className="label">
          <span>Date of document (IST)</span>
          <input
            type="date"
            name="occurredAt"
            required
            className="input"
            disabled={isPending}
          />
          {fieldErrors.occurredAt && (
            <span className="error text-xs">{fieldErrors.occurredAt[0]}</span>
          )}
        </label>

        <label className="label">
          <span>Hospital or Clinic</span>
          <select
            name="institutionId"
            required
            className="input"
            defaultValue=""
            disabled={isPending}
          >
            <option value="" disabled>
              Select institution…
            </option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.city})
              </option>
            ))}
          </select>
          {fieldErrors.institutionId && (
            <span className="error text-xs">{fieldErrors.institutionId[0]}</span>
          )}
        </label>

        <label className="label">
          <span>File (PDF, PNG, or JPEG up to 5 MB)</span>
          <input
            type="file"
            name="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            required
            className="input"
            disabled={isPending}
          />
          {fieldErrors.file && (
            <span className="error text-xs">{fieldErrors.file[0]}</span>
          )}
        </label>

        <div className="row" style={{ gap: "12px", paddingTop: "8px" }}>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-accent"
          >
            {isPending ? "Uploading document…" : "Upload document"}
          </button>
          <Link href="/patient/records" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
