import Link from "next/link";
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
        <div className="card p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Active Patient Consents</h2>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      );
    }
    throw error;
  }

  // Filter for currently active consents: displayStatus === "GRANTED"
  const active = consents.items.filter((c) => c.displayStatus === "GRANTED");

  return (
    <div className="card p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>👥</span>
          <span>Active Patient Consents</span>
        </h2>
        <span className="badge badge-success">{active.length} active</span>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-gray-500">
            No active patient consents.
          </p>
          <Link href="/doctor/patients" className="btn btn-secondary btn-small inline-block">
            Find a patient to request access
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {active.map((c) => (
            <li key={c.id} className="py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">{c.patientName}</span>
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                  Valid until {c.validTo ? formatIST(c.validTo) : "—"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-600">
                <span className="font-medium text-gray-500">Scopes:</span>
                {c.scopes.map((s) => (
                  <span
                    key={s}
                    className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="pt-1">
                <Link
                  href={`/doctor/patients/${c.patientId}`}
                  className="btn btn-secondary btn-small text-xs inline-flex items-center gap-1"
                >
                  <span>Open patient records</span>
                  <span>→</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
