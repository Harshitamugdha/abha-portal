"use client";

import Link from "next/link";
import { PageHead } from "@/components/ui/page-head";

export default function LabOrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="landing">
      <PageHead
        kicker="Diagnostic order"
        title="Diagnostic order error"
      />

      <div className="container dashboard">
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-2">Unable to retrieve diagnostic order.</p>
          <p className="text-sm text-gray-700 mb-4">
            {error.message || "An unexpected error occurred while loading this order. Please try again."}
          </p>
          <div className="row" style={{ gap: "10px" }}>
            <button onClick={reset} className="btn btn-accent">
              Try again
            </button>
            <Link href="/lab" className="btn btn-secondary">
              Back to orders
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
