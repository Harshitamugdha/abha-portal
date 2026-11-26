"use client";

import Link from "next/link";
import { PageHead } from "@/components/ui/page-head";

export default function DoctorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="landing">
      <PageHead kicker="Doctor portal" title="Doctor portal error" />

      <div className="container dashboard">
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-2">Unable to load doctor portal.</p>
          <p className="text-sm text-gray-700 mb-4">
            {error.message || "An unexpected error occurred while loading the doctor portal. Please try again."}
          </p>
          <div className="row" style={{ gap: "10px" }}>
            <button
              type="button"
              onClick={() => reset()}
              className="btn btn-accent"
            >
              Try again
            </button>
            <Link href="/" className="btn btn-secondary">
              Go to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
