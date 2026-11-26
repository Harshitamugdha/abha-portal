"use client";

import Link from "next/link";
import { PageHead } from "@/components/ui/page-head";

export default function LabOrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="landing">
      <PageHead
        kicker="Diagnostic portal"
        title="Diagnostic lab orders"
      />

      <div className="container dashboard">
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-2">Unable to retrieve diagnostic lab orders.</p>
          <p className="text-sm text-gray-700 mb-4">
            {error.message || "An unexpected error occurred while loading lab orders. Please try again."}
          </p>
          <div className="row" style={{ gap: "10px" }}>
            <button onClick={reset} className="btn btn-accent">
              Try again
            </button>
            <Link href="/lab" className="btn btn-secondary">
              Refresh orders
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
