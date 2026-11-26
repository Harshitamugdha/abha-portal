import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui/page-head";
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
        <PageHead kicker="Add to your health record" title="Upload a document" />

        <div className="container dashboard">
          <div className="auth-layout">
            <UploadDocumentForm institutions={institutions} />
            <aside className="help-panel" aria-label="About uploads">
              <h2>What you can upload</h2>
              <ul>
                <li>Old records from before your hospital joined, such as discharge summaries or prescriptions.</li>
                <li>A PDF, PNG or JPEG file, up to 5 MB.</li>
                <li>Doctors see your uploads only while you have given them access to documents.</li>
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
