"use client";

import Link from "next/link";

export default function RecordsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="landing">
      <section className="band">
        <div className="container page-head">
          <p className="step-label">Your account</p>
          <h1 className="auth-title">Unable to load health records</h1>
        </div>
      </section>

      <div className="container dashboard">
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-2">Something went wrong while retrieving records.</p>
          <p className="text-sm text-gray-600 mb-4">{error.message || "Please try again in a few moments."}</p>
          <div className="row" style={{ gap: "10px" }}>
            <button onClick={reset} className="btn btn-accent">
              Try again
            </button>
            <Link href="/patient" className="btn btn-secondary">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
