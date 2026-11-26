import { PageHead } from "@/components/ui/page-head";

export default function LabOrdersLoading() {
  return (
    <main className="landing">
      <PageHead
        kicker="Diagnostic portal"
        title="Diagnostic lab orders"
      />

      <div className="container dashboard">
        <div className="card text-center py-12">
          <p className="muted">Loading diagnostic lab orders…</p>
        </div>
      </div>
    </main>
  );
}
