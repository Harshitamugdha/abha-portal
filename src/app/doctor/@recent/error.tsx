"use client";

export default function RecentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card p-6 border border-red-200 bg-red-50 text-red-900" role="alert">
      <h3 className="font-semibold text-base mb-1">Unable to load recent patients</h3>
      <p className="text-sm text-red-700 mb-4">
        {error.message || "An unexpected error occurred while loading active patient consents."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="btn btn-secondary btn-small"
      >
        Try again
      </button>
    </div>
  );
}
