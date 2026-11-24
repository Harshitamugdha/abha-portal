import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import type { ConsentDTO } from "@/contracts/consent";
import { getSession } from "@/server/auth/session";
import { listConsents } from "@/server/consent/engine";
import { PATIENT_LINKS } from "../patient-links";
import { ConsentCard } from "./consent-card";

const TABS = [
  { key: "waiting", label: "Waiting for you", empty: "No doctor is waiting for an answer." },
  { key: "active", label: "Active", empty: "No doctor can see your records right now." },
  { key: "past", label: "Past", empty: "No past consents yet." },
];

function tabFor(consent: ConsentDTO) {
  if (consent.displayStatus === "REQUESTED") {
    return "waiting";
  }
  if (consent.displayStatus === "GRANTED") {
    return "active";
  }
  return "past";
}

export default async function ConsentCenterPage(props: PageProps<"/patient/consents">) {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const result = await listConsents(user, { page: 1, pageSize: 50 });

  const groups: Record<string, ConsentDTO[]> = { waiting: [], active: [], past: [] };
  for (const consent of result.items) {
    groups[tabFor(consent)].push(consent);
  }

  const searchParams = await props.searchParams;
  let currentTab = "active";
  if (groups.waiting.length > 0) {
    currentTab = "waiting";
  }
  if (searchParams.tab === "waiting" || searchParams.tab === "active" || searchParams.tab === "past") {
    currentTab = searchParams.tab;
  }

  let emptyText = "";
  for (const tab of TABS) {
    if (tab.key === currentTab) {
      emptyText = tab.empty;
    }
  }
  const shown = groups[currentTab];

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="landing">
        <section className="band">
          <div className="container page-head">
            <p className="step-label">Your account</p>
            <h1 className="auth-title">Consents</h1>
          </div>
        </section>

        <div className="container dashboard">
          <div className="auth-layout">
            <div>
              <nav className="tab-links" aria-label="Consent lists">
                {TABS.map((tab) => (
                  <Link
                    key={tab.key}
                    href={"/patient/consents?tab=" + tab.key}
                    aria-current={tab.key === currentTab ? "page" : undefined}
                  >
                    {tab.label} ({groups[tab.key].length})
                  </Link>
                ))}
              </nav>
              <div className="tab-panel">
                {shown.length === 0 && <p className="empty">{emptyText}</p>}
                {shown.map((consent) => (
                  <ConsentCard key={consent.id} consent={consent} />
                ))}
              </div>
            </div>

            <aside className="help-panel" aria-label="About consent">
              <h2>About consent</h2>
              <ul>
                <li>A doctor sees your records only while a consent is active.</li>
                <li>When you approve, you can untick record types you don&apos;t want to share.</li>
                <li>Access ends on its own at the end date. You can revoke it earlier at any time.</li>
                <li>Records a doctor wrote themselves stay visible to them.</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
