"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { uploadLabResult } from "@/app/actions/lab";

type OrderResultFormProps = {
  orderId: string;
};

export function OrderResultForm({ orderId }: OrderResultFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);
    setFieldErrors({});
    setSuccessMsg(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const file = formData.get("file");
    if (!file || !(file instanceof Blob) || file.size === 0) {
      setErrorMsg("Please select a diagnostic report file to upload.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("The file is larger than 5 MB.");
      setErrorCode("FILE_TOO_LARGE");
      return;
    }

    startTransition(async () => {
      try {
        const res = await uploadLabResult(formData);
        if (res.ok) {
          setSuccessMsg("Diagnostic result uploaded successfully. Order is now COMPLETED.");
          form.reset();
          router.refresh();
        } else {
          setErrorMsg(res.error.message || "Failed to upload diagnostic result.");
          setErrorCode(res.error.code || null);
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
          setErrorCode("FILE_TOO_LARGE");
        } else {
          setErrorMsg("An unexpected error occurred while uploading. Please try again.");
          setErrorCode("INTERNAL");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div
          className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800"
          role="alert"
          data-testid="upload-error-alert"
        >
          <div className="font-semibold text-sm flex items-center gap-2">
            <span>⚠</span>
            <span>
              {errorCode === "CONFLICT"
                ? "Already Completed (409 Conflict)"
                : errorCode
                  ? `${errorCode} Error`
                  : "Upload Failed"}
            </span>
          </div>
          <p className="text-sm mt-1 text-red-700">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div
          className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800"
          role="status"
          data-testid="upload-success-alert"
        >
          <div className="font-semibold text-sm flex items-center gap-2">
            <span>✓</span>
            <span>Result Uploaded</span>
          </div>
          <p className="text-sm mt-1 text-emerald-700">{successMsg}</p>
        </div>
      )}

      <input type="hidden" name="orderId" value={orderId} />

      <div>
        <label htmlFor="file" className="block text-sm font-semibold text-gray-900 mb-1">
          Upload Diagnostic Report (PDF, PNG, JPEG up to 5 MB) <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          id="file"
          name="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          required
          disabled={isPending}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-slate-300 rounded p-2 bg-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supported file types: PDF, PNG, JPEG. Maximum size: 5 MB.
        </p>
        {fieldErrors.file?.map((err, idx) => (
          <p key={idx} className="text-xs text-red-600 mt-1">
            {err}
          </p>
        ))}
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-semibold text-gray-900 mb-1">
          Diagnostic Findings & Summary <span className="text-red-500">*</span>
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={4}
          maxLength={2000}
          required
          disabled={isPending}
          placeholder="Enter findings, quantitative results, or clinical summary (e.g. Fasting Blood Glucose: 98 mg/dL, HbA1c: 5.6% within normal limits)..."
          className="block w-full rounded border border-slate-300 p-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Provide a concise summary visible to the patient and authorized clinicians (max 2000 characters).
        </p>
        {fieldErrors.summary?.map((err, idx) => (
          <p key={idx} className="text-xs text-red-600 mt-1">
            {err}
          </p>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-accent px-6 py-2"
        >
          {isPending ? "Uploading Result..." : "Upload Result & Complete Order"}
        </button>
      </div>
    </form>
  );
}
