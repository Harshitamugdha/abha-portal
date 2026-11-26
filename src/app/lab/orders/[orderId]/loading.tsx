import { PageHead } from "@/components/ui/page-head";

export default function LabOrderDetailLoading() {
  return (
    <main className="landing">
      <PageHead
        kicker="Diagnostic order"
        title="Loading diagnostic order…"
      />

      <div className="container dashboard">
        <div className="card text-center py-12">
          <p className="muted">Loading diagnostic order details…</p>
        </div>
      </div>
    </main>
  );
}
