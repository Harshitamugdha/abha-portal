import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { listInstitutionChoices } from "@/server/records/institutions";
import { PATIENT_LINKS } from "../patient-links";
import { UploadDocumentForm } from "./upload-form";

export default async function PatientUploadPage() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  const institutions = await listInstitutionChoices();

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="landing">
        <section className="band">
          <div className="container page-head">
            <p className="step-label">Add to your health record</p>
            <h1 className="auth-title">Upload document</h1>
          </div>
        </section>

        <div className="container dashboard">
          <UploadDocumentForm institutions={institutions} />
        </div>
      </main>
    </>
  );
}
