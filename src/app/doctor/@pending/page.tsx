import { RECORD_TYPE_LABELS } from "@/components/ui/record-labels";
import { formatIST } from "@/contracts/format";
import { getSession } from "@/server/auth/session";
import { listConsents } from "@/server/consent/engine";
import { ApiError } from "@/server/http";

export default async function DoctorPendingSlot() {
  const user = await getSession();
  if (!user || user.role !== "DOCTOR") {
    return null;
  }

  let consents;
  try {
    consents = await listConsents(user, { status: "REQUESTED", page: 1, pageSize: 20 });
  } catch (error) {
    if (error instanceof ApiError) {
      return (
        <section className="panel">
          <h2>Waiting for the patient</h2>
          <p className="muted">{error.message}</p>
        </section>
      );
    }
    throw error;
  }

  const items = consents.items;

  return (
    <section className="panel" aria-labelledby="pending-title">
      <div className="panel-head">
        <h2 id="pending-title">Waiting for the patient</h2>
        <span className="badge badge-amber">{items.length} waiting</span>
      </div>

      {items.length === 0 && <p className="muted">No requests are waiting for a patient&apos;s answer.</p>}

      {items.length > 0 && (
        <ul className="panel-list">
          {items.map((c) => (
            <li key={c.id}>
              <div className="panel-row">
                <strong>{c.patientName}</strong>
                <span className="muted">Asked {formatIST(c.requestedAt)}</span>
              </div>
              <p>Purpose: {c.purpose}</p>
              <p className="muted">Asked for: {c.scopes.map((s) => RECORD_TYPE_LABELS[s]).join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
