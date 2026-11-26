import { notFound, redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { getPatientHeader } from "@/server/clinical/lookup";
import { latestConsent } from "@/server/consent/engine";
import { db } from "@/server/db";
import { DOCTOR_LINKS } from "../../../doctor-links";
import { ConsentRequestForm } from "./consent-request-form";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function RequestConsentPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  // Role check: Asha (patient) opening the form URL is redirected to /patient
  if (user.role === "PATIENT") {
    redirect("/patient");
  }
  if (user.role !== "DOCTOR") {
    redirect("/");
  }

  const { patientId } = await params;

  let header;
  try {
    header = await getPatientHeader(user, patientId);
  } catch {
    notFound();
  }

  // Doctor at multiple institutions (Part C): query institutions for selection
  let institutions: Array<{ id: string; name: string }> = [];
  if (user.institutionIds && user.institutionIds.length > 1) {
    institutions = await db.institution.findMany({
      where: { id: { in: user.institutionIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  // Check if a request is already open
  const latest = await latestConsent(user, patientId).catch(() => null);
  const existingOpenRequest = latest && latest.status === "REQUESTED" ? latest : null;

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead
          kicker="Consent request"
          title={`Request access: ${header.name}`}
        />

        <div className="container dashboard">
          <ConsentRequestForm
            patientId={patientId}
            patientName={header.name}
            institutions={institutions}
            existingOpenRequest={existingOpenRequest}
          />
        </div>
      </main>
    </>
  );
}
