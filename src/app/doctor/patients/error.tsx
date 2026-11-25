"use client";

import Link from "next/link";

export default function DoctorPatientsError({
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
          <p className="step-label">Doctor portal</p>
          <h1 className="auth-title">Patient search error</h1>
        </div>
      </section>

      <div className="container dashboard">
        <div className="alert-panel" role="alert">
          <p className="error font-medium mb-2">Something went wrong while searching for the patient.</p>
          <p className="text-sm text-gray-600 mb-4">
            {error.message || "Please try again in a few moments."}
          </p>
          <div className="row" style={{ gap: "10px" }}>
            <button onClick={reset} className="btn btn-accent">
              Try again
            </button>
            <Link href="/doctor/patients" className="btn btn-secondary">
              Back to search
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
