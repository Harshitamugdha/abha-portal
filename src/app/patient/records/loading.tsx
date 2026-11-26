export default function RecordsLoading() {
  return (
    <main className="landing">
      <section className="band">
        <div className="container page-head">
          <p className="step-label">Your medical timeline</p>
          <h1 className="auth-title">Health records</h1>
        </div>
      </section>

      <div className="container dashboard">
        <div className="card text-center py-12">
          <p className="muted">Loading your health records…</p>
        </div>
      </div>
    </main>
  );
}
