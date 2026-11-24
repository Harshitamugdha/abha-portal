import { notFound, redirect } from "next/navigation";
import { RecordTimeline } from "@/components/ui/record-timeline";
import { TopBar } from "@/components/ui/top-bar";
import { RecordDTO } from "@/contracts/records";
import { getSession } from "@/server/auth/session";
import { PATIENT_LINKS } from "../patient-links";
import { FIXTURE_RECORDS } from "./fixtures";

export default async function PatientRecordsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  // Parse all fixture records with RecordDTO schema to ensure type validity
  const records: RecordDTO[] = FIXTURE_RECORDS.map((item) => RecordDTO.parse(item));

  return (
    <>
      <TopBar name={user.name} links={PATIENT_LINKS} />
      <main className="page">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1>Health Records</h1>
            <p className="muted text-sm">
              All clinical records from every hospital, lab, and clinic linked to your ABHA profile.
            </p>
          </div>
        </div>

        <RecordTimeline records={records} />
      </main>
    </>
  );
}
