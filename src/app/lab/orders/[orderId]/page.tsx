import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatIST } from "@/contracts/format";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { OrderResultForm } from "./order-result-form";

const LAB_LINKS = [{ href: "/lab", label: "Lab orders" }];

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function LabOrderDetailPage({ params }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }
  if (user.role === "PATIENT") {
    redirect("/patient");
  }
  if (user.role === "DOCTOR") {
    redirect("/doctor");
  }
  if (user.role !== "LAB") {
    redirect("/");
  }

  const { orderId } = await params;

  const order = await db.labOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      labInstitutionId: true,
      tests: true,
      status: true,
      createdAt: true,
      resultRecordId: true,
      patient: { select: { name: true } },
      orderedBy: { select: { name: true } },
      labInstitution: { select: { name: true } },
      resultRecord: {
        select: {
          id: true,
          title: true,
          summary: true,
          occurredAt: true,
          fileId: true,
        },
      },
    },
  });

  if (!order || !user.institutionIds.includes(order.labInstitutionId)) {
    notFound();
  }

  const isCompleted = order.status === "COMPLETED";

  return (
    <>
      <TopBar name={user.name} links={LAB_LINKS} />
      <main className="landing">
        <PageHead kicker="Lab order" title={"Tests for " + order.patient.name} />

        <div className="container dashboard">
          <Link href="/lab" className="accent-link">
            Back to lab orders
          </Link>

          <div className="form-card">
            <dl className="summary">
              <dt>Status</dt>
              <dd>
                <span className={isCompleted ? "badge badge-green" : "badge badge-amber"}>
                  {isCompleted ? "Completed" : "Waiting for result"}
                </span>
              </dd>
              <dt>Patient</dt>
              <dd>{order.patient.name}</dd>
              <dt>Ordered by</dt>
              <dd>{order.orderedBy.name}</dd>
              <dt>Lab</dt>
              <dd>{order.labInstitution.name}</dd>
              <dt>Ordered on</dt>
              <dd>{formatIST(order.createdAt)}</dd>
              <dt>Tests</dt>
              <dd>{order.tests.join(", ")}</dd>
            </dl>

            {isCompleted && order.resultRecord && (
              <section aria-labelledby="result-title">
                <h2 id="result-title" className="form-section">
                  Result
                </h2>
                <dl className="summary">
                  <dt>Report</dt>
                  <dd>{order.resultRecord.title}</dd>
                  <dt>Completed on</dt>
                  <dd>{formatIST(order.resultRecord.occurredAt)}</dd>
                  <dt>Findings</dt>
                  <dd className="pre-line">{order.resultRecord.summary || "No summary given."}</dd>
                </dl>
                {order.resultRecord.fileId && (
                  <a
                    href={"/api/v1/files/" + order.resultRecord.fileId}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    Open report file
                  </a>
                )}
              </section>
            )}

            {!isCompleted && (
              <section aria-labelledby="upload-title">
                <h2 id="upload-title" className="form-section">
                  Upload the result
                </h2>
                <OrderResultForm orderId={order.id} />
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
