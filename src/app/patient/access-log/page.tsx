import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { AccessLogQuery } from "@/contracts/audit";
import { formatIST } from "@/contracts/format";
import { listMyAccessLog } from "@/server/audit/queries";
import { getSession } from "@/server/auth/session";
import { PATIENT_LINKS } from "../patient-links";

const ACTION_LABELS: Record<string, string> = {
  "record:list": "Viewed your records",
  "record:read": "Opened a record",
  "file:read": "Opened a file",
  "record:create:clinical": "Added a record",
  "labOrder:create": "Ordered a lab test",
  "labResult:upload": "Uploaded a lab result",
  "consent:request": "Asked for access",
  "consent:list": "Checked their consent",
  "patient:lookup": "Looked you up",
  "prescription:lookup": "Looked up a prescription",
  "prescription:dispense": "Dispensed a prescription",
};

function whatHappened(action: string) {
  return ACTION_LABELS[action] || action;
}

function consentText(outcome: string, reason: string | null, purpose: string | null) {
  if (outcome === "DENIED") {
    if (reason === "NO_ACTIVE_CONSENT" || reason === "SCOPE_EXCLUDED") {
      return "No consent at the time";
    }
    return "Refused";
  }
  return purpose || "—";
}

export default async function AccessLogPage(props: PageProps<"/patient/access-log">) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const query = AccessLogQuery.parse({ page: searchParams.page });
  const log = await listMyAccessLog(user, query);
  const lastPage = Math.max(1, Math.ceil(log.total / log.pageSize));

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="page">
        <h1>Who viewed my records</h1>

        {log.items.length === 0 && <p className="muted">Nobody has looked at your records yet.</p>}

        {log.items.length > 0 && (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>What</th>
                  <th>Under consent</th>
                </tr>
              </thead>
              <tbody>
                {log.items.map((entry) => (
                  <tr key={entry.id} className={entry.outcome === "DENIED" ? "denied" : ""}>
                    <td>{formatIST(entry.at)}</td>
                    <td>
                      {entry.actorName} ({entry.actorRole.toLowerCase()})
                    </td>
                    <td>{whatHappened(entry.action)}</td>
                    <td>{consentText(entry.outcome, entry.reason, entry.consentPurpose)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="row">
          {log.page > 1 && (
            <Link className="link" href={"/patient/access-log?page=" + (log.page - 1)}>
              Newer
            </Link>
          )}
          <span className="muted">
            Page {log.page} of {lastPage}
          </span>
          {log.page < lastPage && (
            <Link className="link" href={"/patient/access-log?page=" + (log.page + 1)}>
              Older
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
