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
        <div className="card p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Pending Requests</h2>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      );
    }
    throw error;
  }

  const items = consents.items;

  return (
    <div className="card p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>⏳</span>
          <span>Pending Requests</span>
        </h2>
        <span className="badge badge-amber">{items.length} waiting</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          No pending consent requests waiting for patient approval.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((c) => (
            <li key={c.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">{c.patientName}</span>
                <span className="text-xs text-gray-500">{formatIST(c.requestedAt)}</span>
              </div>
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-700">Purpose:</span> {c.purpose}
              </p>
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <span className="text-xs text-gray-500">Scopes:</span>
                {c.scopes.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
