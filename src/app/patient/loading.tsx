export default function PatientLoading() {
  return (
    <main className="landing">
      <section className="band">
        <div className="container page-head">
          <p className="step-label">Your account</p>
          <h1 className="auth-title">Loading account…</h1>
        </div>
      </section>

      <div className="container dashboard">
        <div className="card text-center py-12">
          <p className="muted">Loading patient dashboard…</p>
        </div>
      </div>
    </main>
  );
}
