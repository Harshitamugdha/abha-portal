import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <h1>ABHA Health Portal</h1>
      <div className="card">
        <p>Your health records from every hospital in one place.</p>
        <p className="muted">Doctors see them only while you allow it, and you can see who looked.</p>
      </div>
      <div className="row">
        <Link className="btn" href="/login">
          Patient login (ABHA)
        </Link>
        <Link className="btn btn-secondary" href="/staff/login">
          Staff login
        </Link>
      </div>
    </main>
  );
}
