import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import type { ConsentDTO } from "@/contracts/consent";
import { getSession } from "@/server/auth/session";
import { listConsents } from "@/server/consent/engine";
import { PATIENT_LINKS } from "../patient-links";
import { ConsentCard } from "./consent-card";

type SectionProps = {
  title: string;
  consents: ConsentDTO[];
  empty: string;
};

function Section({ title, consents, empty }: SectionProps) {
  return (
    <section>
      <h2>{title}</h2>
      {consents.length === 0 && <p className="muted">{empty}</p>}
      {consents.map((consent) => (
        <ConsentCard key={consent.id} consent={consent} />
      ))}
    </section>
  );
}

export default async function ConsentCenterPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const result = await listConsents(user, { page: 1, pageSize: 50 });

  const waiting: ConsentDTO[] = [];
  const active: ConsentDTO[] = [];
  const past: ConsentDTO[] = [];
  for (const consent of result.items) {
    if (consent.displayStatus === "REQUESTED") {
      waiting.push(consent);
    } else if (consent.displayStatus === "GRANTED") {
      active.push(consent);
    } else {
      past.push(consent);
    }
  }

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="page">
        <h1>Consents</h1>
        <Section title="Waiting for you" consents={waiting} empty="No doctor is waiting for an answer." />
        <Section title="Active" consents={active} empty="No doctor can see your records right now." />
        <Section title="Past" consents={past} empty="Nothing here yet." />
      </main>
    </>
  );
}
