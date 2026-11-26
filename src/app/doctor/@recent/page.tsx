import Link from "next/link";
import { RECORD_TYPE_LABELS } from "@/components/ui/record-labels";
import { formatIST } from "@/contracts/format";
import { getSession } from "@/server/auth/session";
import { listConsents } from "@/server/consent/engine";
import { ApiError } from "@/server/http";

export default async function DoctorRecentSlot() {
  const user = await getSession();
  if (!user || user.role !== "DOCTOR") {
    return null;
  }

  let consents;
  try {
    consents = await listConsents(user, { status: "GRANTED", page: 1, pageSize: 20 });
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        <section className="panel">
          <h2>Patients you can see now</h2>
          <p className="muted">{error.message}</p>
        </section>
      );
    }
    throw error;
  }

  const active = consents.items.filter((c) => c.displayStatus === "GRANTED");

  return (
    <section className="panel" aria-labelledby="active-title">
      <div className="panel-head">
        <h2 id="active-title">Patients you can see now</h2>
        <span className="badge badge-green">{active.length} active</span>
      </div>

      {active.length === 0 && (
        <>
          <p className="muted">No patient has given you access right now.</p>
          <Link href="/doctor/patients" className="accent-link">
            Find a patient to ask for access
          </Link>
        </>
      )}

      {active.length > 0 && (
        <ul className="panel-list">
          {active.map((c) => (
            <li key={c.id}>
              <div className="panel-row">
                <strong>{c.patientName}</strong>
                {c.validTo && <span className="muted">Until {formatIST(c.validTo)}</span>}
              </div>
              <p className="muted">Can see: {c.scopes.map((s) => RECORD_TYPE_LABELS[s]).join(", ")}</p>
              <Link href={"/doctor/patients/" + c.patientId} className="accent-link">
                Open records
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
