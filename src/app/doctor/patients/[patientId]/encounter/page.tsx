import { notFound, redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { getPatientHeader } from "@/server/clinical/lookup";
import { db } from "@/server/db";
import { DOCTOR_LINKS } from "../../../doctor-links";
import { EncounterForm } from "./encounter-form";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function DoctorEncounterPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

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

  // Load institutions if doctor belongs to multiple
  let institutions: Array<{ id: string; name: string }> = [];
  if (user.institutionIds && user.institutionIds.length > 1) {
    institutions = await db.institution.findMany({
      where: { id: { in: user.institutionIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead
          kicker="Clinical encounter"
          title={`Record consultation visit: ${header.name}`}
        />

        <div className="container dashboard">
          <EncounterForm
            patientId={patientId}
            patientName={header.name}
            institutions={institutions}
          />
        </div>
      </main>
    </>
  );
}
