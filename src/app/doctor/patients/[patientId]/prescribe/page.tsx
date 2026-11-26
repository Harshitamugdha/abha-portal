import { notFound, redirect } from "next/navigation";
import { ConsentRequired } from "@/components/ui/consent-required";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { getPatientHeader } from "@/server/clinical/lookup";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { listPatientRecords } from "@/server/records/list";
import { DOCTOR_LINKS } from "../../../doctor-links";
import { PrescribeForm } from "./prescribe-form";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function PrescribePage({ params }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  // Role check: patient opening the prescribe URL is redirected to /patient
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

  // Multi-institution support: query institutions if doctor belongs to > 1
  let institutions: Array<{ id: string; name: string }> = [];
  if (user.institutionIds && user.institutionIds.length > 1) {
    institutions = await db.institution.findMany({
      where: { id: { in: user.institutionIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  // List this patient's prescriptions; catch the consent error in the Server Component and render Consent required
  let initialPrescriptions = [];
  try {
    const page = await listPatientRecords(user, {
      patientId,
      type: "PRESCRIPTION",
    });
    initialPrescriptions = page.items;
  } catch (error) {
    if (error instanceof ApiError && error.code === "CONSENT_REQUIRED") {
      return (
        <>
          <TopBar name={user.name} links={DOCTOR_LINKS} />
          <main className="landing">
            <PageHead
              kicker="Clinical prescription"
              title={`Write prescription: ${header.name}`}
            />
            <div className="container dashboard">
              <ConsentRequired patientId={patientId} patientName={header.name} />
            </div>
          </main>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead
          kicker="Clinical prescription"
          title={`Write prescription: ${header.name}`}
        />

        <div className="container dashboard">
          <PrescribeForm
            patientId={patientId}
            patientName={header.name}
            doctorName={user.name}
            institutions={institutions}
            initialPrescriptions={initialPrescriptions}
          />
        </div>
      </main>
    </>
  );
}
