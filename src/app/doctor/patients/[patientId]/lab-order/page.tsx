import { notFound, redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { getPatientHeader } from "@/server/clinical/lookup";
import { listInstitutionChoices } from "@/server/records/institutions";
import { DOCTOR_LINKS } from "../../../doctor-links";
import { LabOrderForm } from "./lab-order-form";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function DoctorLabOrderPage({ params }: PageProps) {
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

  // Load registered diagnostic laboratories
  const allInstitutions = await listInstitutionChoices();
  const labs = allInstitutions.filter((i) => i.type === "LAB");

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead
          kicker="Diagnostic orders"
          title={`Order lab tests: ${header.name}`}
        />

        <div className="container dashboard">
          <LabOrderForm
            patientId={patientId}
            patientName={header.name}
            labs={labs}
          />
        </div>
      </main>
    </>
  );
}
