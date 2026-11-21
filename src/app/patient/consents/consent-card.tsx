"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveConsent, denyConsent, revokeConsent } from "@/app/actions/consent";
import type { ConsentDTO } from "@/contracts/consent";
import { formatIST } from "@/contracts/format";
import type { ActionResult, RecordType } from "@/contracts/shared";

const SCOPE_LABELS: Record<RecordType, string> = {
  ENCOUNTER: "Visits",
  PRESCRIPTION: "Prescriptions",
  LAB_REPORT: "Lab reports",
  DOCUMENT: "Documents",
};

function scopeList(scopes: RecordType[]) {
  const labels: string[] = [];
  for (const scope of scopes) {
    labels.push(SCOPE_LABELS[scope]);
  }
  return labels.join(", ");
}

export function ConsentCard({ consent }: { consent: ConsentDTO }) {
  const router = useRouter();
  const [showApprove, setShowApprove] = useState(false);
  const [ticked, setTicked] = useState<RecordType[]>(consent.scopes);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(scope: RecordType) {
    if (ticked.includes(scope)) {
      setTicked(ticked.filter((item) => item !== scope));
    } else {
      setTicked([...ticked, scope]);
    }
  }

  function showResult(result: ActionResult<ConsentDTO>) {
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setShowApprove(false);
    router.refresh();
  }

  async function approve() {
    setBusy(true);
    setError("");
    showResult(await approveConsent({ consentId: consent.id, scopes: ticked }));
  }

  async function deny() {
    setBusy(true);
    setError("");
    showResult(await denyConsent({ consentId: consent.id }));
  }

  async function revoke() {
    const question =
      consent.doctorName +
      " will immediately stop seeing your " +
      scopeList(consent.scopes).toLowerCase() +
      ". Records they wrote themselves stay visible to them. Revoke?";
    if (!window.confirm(question)) {
      return;
    }
    setBusy(true);
    setError("");
    showResult(await revokeConsent({ consentId: consent.id }));
  }

  const waiting = consent.displayStatus === "REQUESTED";
  const active = consent.displayStatus === "GRANTED";

  return (
    <div className="card">
      <p>
        <strong>{consent.doctorName}</strong> · {consent.institutionName}
      </p>
      <p>Records: {scopeList(consent.scopes)}</p>
      <p>Purpose: {consent.purpose}</p>
      <p className="muted">
        Asked {formatIST(consent.requestedAt)} · for {consent.durationDays} days
      </p>
      {active && consent.validTo && <p className="muted">Access until {formatIST(consent.validTo)}</p>}
      {!waiting && !active && <p className="muted">Status: {consent.displayStatus.toLowerCase()}</p>}

      {waiting && !showApprove && (
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => setShowApprove(true)}>
            Approve…
          </button>
          <button className="btn btn-secondary" disabled={busy} onClick={deny}>
            Deny
          </button>
        </div>
      )}

      {waiting && showApprove && (
        <div>
          <p>Untick anything you don&apos;t want to share:</p>
          {consent.scopes.map((scope) => (
            <label key={scope} className="row">
              <input type="checkbox" checked={ticked.includes(scope)} onChange={() => toggle(scope)} />
              {SCOPE_LABELS[scope]}
            </label>
          ))}
          <div className="row">
            <button className="btn" disabled={busy || ticked.length === 0} onClick={approve}>
              Approve for {consent.durationDays} days
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => setShowApprove(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {active && (
        <div className="row">
          <button className="btn btn-danger" disabled={busy} onClick={revoke}>
            Revoke
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
