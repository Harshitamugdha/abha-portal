"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveConsent, denyConsent, revokeConsent } from "@/app/actions/consent";
import type { ConsentDTO } from "@/contracts/consent";
import { formatIST } from "@/contracts/format";
import type { ActionResult, RecordType } from "@/contracts/shared";

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

const SCOPE_LABELS: Record<RecordType, string> = {
  ENCOUNTER: "Visits",
  PRESCRIPTION: "Prescriptions",
  LAB_REPORT: "Lab reports",
  DOCUMENT: "Documents",
};

const STATUS_BADGES = {
  REQUESTED: { text: "Waiting for you", className: "badge badge-amber" },
  GRANTED: { text: "Active", className: "badge badge-green" },
  DENIED: { text: "Denied", className: "badge badge-grey" },
  REVOKED: { text: "Revoked", className: "badge badge-red" },
  EXPIRED: { text: "Ended", className: "badge badge-grey" },
};

function scopeList(scopes: RecordType[]) {
  const labels: string[] = [];
  for (const scope of scopes) {
    labels.push(SCOPE_LABELS[scope]);
  }
  return labels.join(", ");
}

type Mode = "view" | "approve" | "revoke";

export function ConsentCard({ consent }: { consent: ConsentDTO }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
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

  async function send(action: () => Promise<ActionResult<ConsentDTO>>, nextTab: string) {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMode("view");
      router.push("/patient/consents?tab=" + nextTab);
      router.refresh();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  }

  function approve() {
    send(() => approveConsent({ consentId: consent.id, scopes: ticked }), "active");
  }

  function deny() {
    send(() => denyConsent({ consentId: consent.id }), "past");
  }

  function revoke() {
    send(() => revokeConsent({ consentId: consent.id }), "past");
  }

  const waiting = consent.displayStatus === "REQUESTED";
  const active = consent.displayStatus === "GRANTED";
  const badge = STATUS_BADGES[consent.displayStatus];

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <p className="card-title">{consent.doctorName}</p>
          <p className="muted">{consent.institutionName}</p>
        </div>
        <span className={badge.className}>{badge.text}</span>
      </div>

      <dl className="summary">
        <dt>Records</dt>
        <dd>{scopeList(consent.scopes)}</dd>
        <dt>Purpose</dt>
        <dd>{consent.purpose}</dd>
        <dt>Duration</dt>
        <dd>{consent.durationDays} days</dd>
        <dt>Asked on</dt>
        <dd>{formatIST(consent.requestedAt)}</dd>
        {active && consent.validTo && (
          <>
            <dt>Access until</dt>
            <dd>{formatIST(consent.validTo)}</dd>
          </>
        )}
      </dl>

      {waiting && mode === "view" && (
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => setMode("approve")}>
            Review and approve
          </button>
          <button className="btn btn-secondary" disabled={busy} onClick={deny}>
            Deny
          </button>
        </div>
      )}

      {waiting && mode === "approve" && (
        <div className="approve-panel">
          <fieldset>
            <legend>Choose what {consent.doctorName} can see</legend>
            <p className="muted">Untick anything you don&apos;t want to share.</p>
            {consent.scopes.map((scope) => (
              <label key={scope} className="check-row">
                <input type="checkbox" checked={ticked.includes(scope)} onChange={() => toggle(scope)} />
                {SCOPE_LABELS[scope]}
              </label>
            ))}
          </fieldset>
          <div className="row">
            <button className="btn" disabled={busy || ticked.length === 0} onClick={approve}>
              Approve for {consent.durationDays} days
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => setMode("view")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {active && mode === "view" && (
        <button className="btn btn-danger" disabled={busy} onClick={() => setMode("revoke")}>
          Revoke access
        </button>
      )}

      {active && mode === "revoke" && (
        <div className="confirm-panel">
          <p>
            <strong>Revoke {consent.doctorName}&apos;s access?</strong>
          </p>
          <p>
            They will immediately stop seeing your {scopeList(consent.scopes).toLowerCase()}. Records they wrote
            themselves stay visible to them.
          </p>
          <div className="row tile-status">
            <button className="btn btn-danger" disabled={busy} onClick={revoke}>
              Yes, revoke access
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => setMode("view")}>
              Keep access
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="error tile-status" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
