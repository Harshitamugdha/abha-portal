import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { formatIST } from "@/contracts/format";
import { type AuditOutcome } from "@/contracts/shared";
import { queryAudit } from "@/server/admin/admin";
import { getSession } from "@/server/auth/session";

type PageProps = {
  searchParams: Promise<{
    outcome?: string;
    patientId?: string;
    actorId?: string;
    page?: string;
  }>;
};

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const sp = await searchParams;
  const outcome = sp.outcome === "ALLOWED" || sp.outcome === "DENIED" ? (sp.outcome as AuditOutcome) : undefined;
  const patientId = sp.patientId?.trim() || undefined;
  const actorId = sp.actorId?.trim() || undefined;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;
  const pageSize = 20;

  const result = await queryAudit(user, {
    outcome,
    patientId,
    actorId,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(result.total / pageSize) || 1;

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/staff", label: "Staff Verification" },
    { href: "/admin/audit", label: "Audit Logs" },
    { href: "/admin/institutions", label: "Institutions" },
  ];

  return (
    <>
      <TopBar name={user.name} links={links} />
      <main className="page" style={{ maxWidth: "980px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link href="/admin" className="link">&larr; Back to Admin Panel</Link>
        </div>

        <h1>System Access &amp; Audit Logs</h1>
        <p className="muted" style={{ marginBottom: "20px" }}>
          Immutable audit record of all access authorization decisions. Denied access attempts are visually distinguished.
        </p>

        {/* Filter controls */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <form method="GET" className="row" style={{ gap: "16px", alignItems: "flex-end" }}>
            <label className="label" style={{ minWidth: "160px" }}>
              Outcome
              <select name="outcome" defaultValue={outcome || ""} className="input" style={{ padding: "8px" }}>
                <option value="">All Decisions</option>
                <option value="ALLOWED">ALLOWED</option>
                <option value="DENIED">DENIED</option>
              </select>
            </label>

            <label className="label" style={{ minWidth: "180px" }}>
              Patient ID
              <input
                name="patientId"
                defaultValue={patientId || ""}
                placeholder="e.g. user-asha"
                className="input"
                style={{ padding: "8px" }}
              />
            </label>

            <label className="label" style={{ minWidth: "180px" }}>
              Actor ID
              <input
                name="actorId"
                defaultValue={actorId || ""}
                placeholder="e.g. user-kavya"
                className="input"
                style={{ padding: "8px" }}
              />
            </label>

            <button type="submit" className="btn" style={{ padding: "9px 16px" }}>
              Filter Logs
            </button>
            <Link href="/admin/audit" className="link" style={{ fontSize: "0.9rem", alignSelf: "center" }}>
              Reset
            </Link>
          </form>
        </div>

        {/* Log Table */}
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp (IST)</th>
                <th>Outcome</th>
                <th>Actor Role</th>
                <th>Actor ID</th>
                <th>Action</th>
                <th>Resource Type</th>
                <th>Patient ID</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px" }} className="muted">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                result.items.map((entry) => {
                  const isDenied = entry.outcome === "DENIED";
                  return (
                    <tr
                      key={entry.id}
                      className={isDenied ? "denied" : undefined}
                      style={isDenied ? { background: "#fef2f2" } : undefined}
                    >
                      <td style={{ whiteSpace: "nowrap" }}>{formatIST(entry.at)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            color: isDenied ? "#991b1b" : "#166534",
                            background: isDenied ? "#fee2e2" : "#dcfce7",
                          }}
                        >
                          {entry.outcome}
                        </span>
                      </td>
                      <td>{entry.actorRole}</td>
                      <td><code>{entry.actorId}</code></td>
                      <td><strong>{entry.action}</strong></td>
                      <td>{entry.resourceType}</td>
                      <td>{entry.patientId ? <code>{entry.patientId}</code> : "-"}</td>
                      <td style={{ fontSize: "0.85rem", color: isDenied ? "#b91c1c" : "#4b5563" }}>
                        {entry.reason || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="row" style={{ justifyContent: "space-between", marginTop: "16px" }}>
            <span className="muted" style={{ fontSize: "0.9rem" }}>
              Page {result.page} of {totalPages} ({result.total} total events)
            </span>
            <div className="row">
              {page > 1 && (
                <Link
                  href={`/admin/audit?page=${page - 1}${outcome ? `&outcome=${outcome}` : ""}${patientId ? `&patientId=${patientId}` : ""}`}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                >
                  &larr; Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/audit?page=${page + 1}${outcome ? `&outcome=${outcome}` : ""}${patientId ? `&patientId=${patientId}` : ""}`}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
