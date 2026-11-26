"use client";

import Link from "next/link";

export default function PatientError({
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
          <h1 className="auth-title">Account dashboard error</h1>
        </div>
      </section>

      <div className="container dashboard">
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-2">Unable to load patient dashboard.</p>
          <p className="text-sm text-gray-700 mb-4">
            {error.message || "An unexpected error occurred while loading your account. Please try again."}
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
