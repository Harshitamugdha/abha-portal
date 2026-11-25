export default function DoctorPatientsLoading() {
  return (
    <main className="landing">
      <section className="band">
        <div className="container page-head">
          <p className="step-label">Doctor portal</p>
          <h1 className="auth-title">Find a patient</h1>
        </div>
      </section>

      <div className="container dashboard">
        <div className="card text-center py-12">
          <p className="muted">Searching patient…</p>
        </div>
      </div>
    </main>
  );
}
