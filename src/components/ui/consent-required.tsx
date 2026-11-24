import Link from "next/link";

export function ConsentRequired({
  patientId,
  patientName = "this patient",
}: {
  patientId: string;
  patientName?: string;
}) {
  return (
    <div className="alert-panel" role="alert" style={{ borderLeftColor: "var(--amber, #d97706)" }}>
      <h2 className="text-base font-bold text-amber-900 mb-1">Consent required</h2>
      <p className="text-sm text-amber-800 mb-4">
        You do not have active consent to view medical records for {patientName}. You must request and receive
        scoped, time-bound consent from the patient before their records can be accessed.
      </p>
      <div>
        <Link
          href={`/doctor/patients/${encodeURIComponent(patientId)}/request-consent`}
          className="btn btn-accent inline-block"
        >
          Request access
        </Link>
      </div>
    </div>
  );
}
