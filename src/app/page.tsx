import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <h1>Your health records from every hospital, in one place</h1>
      <p className="lead">
        See your visits, prescriptions and lab reports from every participating hospital. Doctors can see them only
        while you allow it, and you can always see who looked.
      </p>

      <div className="tiles">
        <Link href="/login" className="tile">
          <span className="tile-title">Patients: log in with ABHA</span>
          <span className="muted">Use your 14-digit ABHA number or your ABHA address. We send an OTP to your mobile.</span>
        </Link>
        <Link href="/staff/login" className="tile">
          <span className="tile-title">Doctors, labs, pharmacies and admins</span>
          <span className="muted">Log in with the email and password from your registration.</span>
        </Link>
      </div>

      <h2>How consent works</h2>
      <ol className="steps">
        <li>A doctor asks to see some of your records, for a purpose and a number of days.</li>
        <li>You approve, choose fewer record types, or deny. Nothing is shared until you approve.</li>
        <li>Access ends on its own when the time is up. You can revoke it earlier at any moment.</li>
      </ol>
    </main>
  );
}
