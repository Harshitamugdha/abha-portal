import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatIST } from "@/contracts/format";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { OrderResultForm } from "./order-result-form";

const LAB_LINKS = [{ href: "/lab", label: "Diagnostic Orders" }];

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
        <PageHead
          kicker="Diagnostic order"
          title={`Order: ${order.id}`}
        />

        <div className="container dashboard space-y-6">
          <div className="card p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-sm font-bold text-gray-700">{order.id}</span>
              <span className={`badge ${isCompleted ? "badge-success" : "badge-amber"}`}>
                {order.status}
              </span>
            </div>

            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <dt className="text-gray-500 font-medium">Patient</dt>
                <dd className="font-semibold text-gray-900">{order.patient.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Ordering Doctor</dt>
                <dd className="font-semibold text-gray-900">{order.orderedBy.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Laboratory</dt>
                <dd className="font-semibold text-gray-900">{order.labInstitution.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Date Placed</dt>
                <dd className="font-semibold text-gray-900">{formatIST(order.createdAt)}</dd>
              </div>
            </dl>

            <div className="mb-6">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Requested Tests:</h3>
              <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                {order.tests.map((test, idx) => (
                  <li key={idx} className="font-medium">
                    {test}
                  </li>
                ))}
              </ul>
            </div>

            {isCompleted && order.resultRecord ? (
              <div className="border-t border-slate-200 pt-6 mt-6 bg-slate-50 p-4 rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base text-gray-900">
                    Uploaded Diagnostic Result
                  </h3>
                  <span className="text-xs text-gray-500 font-medium">
                    Completed on {formatIST(order.resultRecord.occurredAt)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Report Title
                    </h4>
                    <p className="text-sm font-medium text-gray-900">{order.resultRecord.title}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Findings & Summary
                    </h4>
                    <p className="text-sm text-gray-800 whitespace-pre-line">
                      {order.resultRecord.summary || "No summary provided."}
                    </p>
                  </div>
                  {order.resultRecord.fileId && (
                    <div className="pt-2">
                      <a
                        href={`/api/v1/files/${order.resultRecord.fileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary inline-flex items-center gap-2"
                      >
                        <span>📄</span>
                        <span>View Uploaded Report</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {!isCompleted ? (
              <div className="border-t border-slate-200 pt-6 mt-6">
                <h3 className="font-semibold text-base text-gray-900 mb-4">
                  Upload Diagnostic Report
                </h3>
                <OrderResultForm orderId={order.id} />
              </div>
            ) : null}

            <div className="pt-6">
              <Link href="/lab" className="btn btn-secondary">
                ← Back to orders list
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
