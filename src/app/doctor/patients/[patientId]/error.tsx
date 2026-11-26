"use client";

import Link from "next/link";
import { PageHead } from "@/components/ui/page-head";

export default function DoctorPatientViewerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="landing">
      <PageHead kicker="Doctor viewer" title="Viewer error" />

      <div className="container dashboard">
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-2">Unable to load patient records.</p>
          <p className="text-sm text-gray-700 mb-4">
            {error.message || "An unexpected error occurred while loading patient records. Please try again."}
          </p>
          <div className="row" style={{ gap: "10px" }}>
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-accent"
            >
              Try again
            </button>
            <Link href="/doctor/patients" className="btn btn-secondary">
              Back to patient search
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
