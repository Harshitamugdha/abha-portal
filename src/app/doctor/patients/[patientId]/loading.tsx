import { PageHead } from "@/components/ui/page-head";

export default function DoctorPatientViewerLoading() {
  return (
    <main className="landing">
      <PageHead kicker="Doctor viewer" title="Loading patient records…" />

      <div className="container dashboard">
        <div className="card text-center py-12">
          <p className="muted">Loading patient profile and records viewer…</p>
        </div>
      </div>
    </main>
  );
}
