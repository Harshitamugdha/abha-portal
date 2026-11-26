import { PageHead } from "@/components/ui/page-head";

export default function DoctorLoading() {
  return (
    <main className="landing">
      <PageHead kicker="Doctor portal" title="Loading doctor portal…" />

      <div className="container dashboard">
        <div className="card text-center py-12">
          <p className="muted">Loading clinical actions and dashboard…</p>
        </div>
      </div>
    </main>
  );
}
