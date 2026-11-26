import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { RECORD_TYPE_LABELS } from "@/components/ui/record-labels";
import { RecordTimeline } from "@/components/ui/record-timeline";
import { TopBar } from "@/components/ui/top-bar";
import { RecordType } from "@/contracts/shared";
import { getSession } from "@/server/auth/session";
import { listPatientInstitutions, listPatientRecords } from "@/server/records/list";
import { getLanguage } from "@/server/i18n";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { getPatientLinks } from "../patient-links";

function toIsoDate(dateStr?: string, endOfDay = false): string | undefined {
  if (!dateStr) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return endOfDay ? `${dateStr}T23:59:59.999Z` : `${dateStr}T00:00:00.000Z`;
  }
  return dateStr;
}

type PageProps = {
  searchParams: Promise<{
    page?: string;
    type?: string;
    institutionId?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function PatientRecordsPage(props: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;

  const queryInput: Record<string, unknown> = {
    patientId: user.id,
    page: searchParams.page,
  };
  if (searchParams.type) queryInput.type = searchParams.type;
  if (searchParams.institutionId) queryInput.institutionId = searchParams.institutionId;
  if (searchParams.from) queryInput.from = toIsoDate(searchParams.from, false);
  if (searchParams.to) queryInput.to = toIsoDate(searchParams.to, true);

  const [data, institutions] = await Promise.all([
    listPatientRecords(user, queryInput),
    listPatientInstitutions(user, user.id).catch(() => []),
  ]);
  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));

  const hasFilters = Boolean(
    searchParams.type || searchParams.institutionId || searchParams.from || searchParams.to,
  );

  function pageUrl(targetPage: number) {
    const params = new URLSearchParams();
    if (targetPage > 1) params.set("page", String(targetPage));
    if (searchParams.type) params.set("type", String(searchParams.type));
    if (searchParams.institutionId) params.set("institutionId", String(searchParams.institutionId));
    if (searchParams.from) params.set("from", String(searchParams.from));
    if (searchParams.to) params.set("to", String(searchParams.to));
    const qs = params.toString();
    return qs ? `/patient/records?${qs}` : "/patient/records";
  }

  const lang = await getLanguage();
  const patientLinks = getPatientLinks(lang);

  return (
    <>
      <TopBar
        name={user.name}
        links={patientLinks}
        extra={<LanguageToggle current={lang} />}
      />
      <main className="landing">
        <section className="band">
          <div className="container page-head">
            <p className="step-label">Your medical timeline</p>
            <h1 className="auth-title">Health records</h1>
          </div>
        </section>

        <div className="container dashboard">
          {/* Plain GET Filter Form */}
          <form method="GET" action="/patient/records" className="card mb-6">
            <div className="row" style={{ gap: "16px", alignItems: "flex-end" }}>
              <label className="label" style={{ minWidth: "180px" }}>
                <span>Record type</span>
                <select name="type" defaultValue={searchParams.type || ""} className="input">
                  <option value="">All types</option>
                  {RecordType.options.map((t) => (
                    <option key={t} value={t}>
                      {RECORD_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label" style={{ minWidth: "180px" }}>
                <span>Institution</span>
                <select name="institutionId" defaultValue={searchParams.institutionId || ""} className="input">
                  <option value="">All institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="label">
                <span>From date</span>
                <input
                  type="date"
                  name="from"
                  defaultValue={typeof searchParams.from === "string" ? searchParams.from.slice(0, 10) : ""}
                  className="input"
                />
              </label>

              <label className="label">
                <span>To date</span>
                <input
                  type="date"
                  name="to"
                  defaultValue={typeof searchParams.to === "string" ? searchParams.to.slice(0, 10) : ""}
                  className="input"
                />
              </label>

              <div className="row" style={{ gap: "8px" }}>
                <button type="submit" className="btn btn-accent">
                  Filter
                </button>
                {hasFilters && (
                  <Link href="/patient/records" className="btn btn-secondary">
                    Clear
                  </Link>
                )}
              </div>
            </div>
          </form>

          {data.items.length === 0 && (
            <EmptyState
              message={
                hasFilters
                  ? "No health records match your selected filters."
                  : "You do not have any health records yet."
              }
              action={
                hasFilters ? (
                  <Link href="/patient/records" className="accent-link">
                    Clear filters
                  </Link>
                ) : (
                  <Link href="/patient/upload" className="btn btn-accent">
                    Upload your first document
                  </Link>
                )
              }
            />
          )}

          {data.items.length > 0 && (
            <div>
              <RecordTimeline records={data.items} />

              <div className="table-footer mt-8">
                <nav aria-label="Pages" className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    {data.page > 1 && (
                      <Link className="accent-link" href={pageUrl(data.page - 1)}>
                        ← Newer
                      </Link>
                    )}
                  </div>
                  <span className="muted">
                    Page {data.page} of {lastPage} ({data.total} {data.total === 1 ? "record" : "records"})
                  </span>
                  <div>
                    {data.page < lastPage && (
                      <Link className="accent-link" href={pageUrl(data.page + 1)}>
                        Older →
                      </Link>
                    )}
                  </div>
                </nav>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
