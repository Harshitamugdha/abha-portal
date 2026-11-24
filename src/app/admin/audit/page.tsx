import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { formatIST } from "@/contracts/format";
import type { AuditOutcome } from "@/contracts/shared";
import { queryAudit } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";
import { ADMIN_LINKS } from "../admin-links";

const PAGE_SIZE = 20;

type Filters = {
  outcome?: AuditOutcome;
  patientId?: string;
  actorId?: string;
};

function text(value: string | string[] | undefined) {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return undefined;
}

function readOutcome(value: string | undefined): AuditOutcome | undefined {
  if (value === "ALLOWED" || value === "DENIED") {
    return value;
  }
  return undefined;
}

function readPage(value: string | undefined) {
  const page = Number(value);
  if (Number.isInteger(page) && page > 0) {
    return page;
  }
  return 1;
}

function pageHref(filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.outcome) {
    params.set("outcome", filters.outcome);
  }
  if (filters.patientId) {
    params.set("patientId", filters.patientId);
  }
  if (filters.actorId) {
    params.set("actorId", filters.actorId);
  }
  params.set("page", String(page));
  return "/admin/audit?" + params.toString();
}

export default async function AdminAuditPage(props: PageProps<"/admin/audit">) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const searchParams = await props.searchParams;
  const filters: Filters = {
    outcome: readOutcome(text(searchParams.outcome)),
    patientId: text(searchParams.patientId),
    actorId: text(searchParams.actorId),
  };
  const page = readPage(text(searchParams.page));

  const result = await queryAudit(user, {
    outcome: filters.outcome,
    patientId: filters.patientId,
    actorId: filters.actorId,
    page: page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <>
      <TopBar name={user.name} links={ADMIN_LINKS} />
      <main className="landing">
        <PageHead kicker="Administration" title="Audit log" />

        <div className="container dashboard">
          <p className="lead">
            Every access decision is recorded here, allowed or refused. It shows who asked for what, never the clinical
            content.
          </p>

          <form method="GET" className="filter-bar" aria-label="Filter the audit log">
            <label className="label">
              Result
              <select name="outcome" defaultValue={filters.outcome || ""} className="input">
                <option value="">All</option>
                <option value="ALLOWED">Allowed</option>
                <option value="DENIED">Refused</option>
              </select>
            </label>
            <label className="label">
              Patient ID
              <input name="patientId" defaultValue={filters.patientId || ""} className="input" />
            </label>
            <label className="label">
              Actor ID
              <input name="actorId" defaultValue={filters.actorId || ""} className="input" />
            </label>
            <div className="row">
              <button type="submit" className="btn btn-accent">
                Apply filters
              </button>
              <Link href="/admin/audit" className="accent-link">
                Clear
              </Link>
            </div>
          </form>

          <div>
            {result.items.length === 0 && <p className="empty">No entries match these filters.</p>}
            {result.items.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Result</th>
                      <th>Who</th>
                      <th>Action</th>
                      <th>Resource</th>
                      <th>Patient</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((entry) => (
                      <tr key={entry.id} className={entry.outcome === "DENIED" ? "denied" : undefined}>
                        <td>{formatIST(entry.at)}</td>
                        <td>
                          {entry.outcome === "DENIED" ? (
                            <span className="badge badge-red">Refused</span>
                          ) : (
                            <span className="badge badge-green">Allowed</span>
                          )}
                        </td>
                        <td>
                          <code>{entry.actorId}</code>
                          <br />
                          <span className="muted">{entry.actorRole.toLowerCase()}</span>
                        </td>
                        <td>
                          <code>{entry.action}</code>
                        </td>
                        <td>{entry.resourceType}</td>
                        <td>{entry.patientId ? <code>{entry.patientId}</code> : "None"}</td>
                        <td>{entry.reason || "None"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="table-footer">
              <span className="muted">
                {result.total} entries · page {result.page} of {totalPages}
              </span>
              <nav aria-label="Pages" className="row">
                {page > 1 && (
                  <Link href={pageHref(filters, page - 1)} className="accent-link">
                    Newer
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={pageHref(filters, page + 1)} className="accent-link">
                    Older
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
