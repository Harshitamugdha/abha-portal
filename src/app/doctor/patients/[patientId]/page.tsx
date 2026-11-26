import { notFound, redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { getPatientHeader } from "@/server/clinical/lookup";
import { ApiError } from "@/server/http";
import { DOCTOR_LINKS } from "../../doctor-links";
import { PatientViewer } from "./patient-viewer";

type PageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function DoctorPatientViewerPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  const { patientId } = await params;

  let header;
  try {
    header = await getPatientHeader(user, patientId);
  } catch (error) {
    if (error instanceof ApiError && (error.code === "NOT_FOUND" || error.code === "VALIDATION_FAILED")) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <TopBar name={user.name} links={DOCTOR_LINKS} />
      <main className="landing">
        <PageHead
          kicker="Doctor viewer"
          title={`Records: ${header.name}`}
        />

        <div className="container dashboard">
          <PatientViewer
            patientId={patientId}
            patientName={header.name}
            abhaNumberMasked={header.abhaNumberMasked}
          />
        </div>
      </main>
    </>
  );
}
