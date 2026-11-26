import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatIST } from "@/contracts/format";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";

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
      patient: { select: { name: true } },
      orderedBy: { select: { name: true } },
      labInstitution: { select: { name: true } },
    },
  });

  if (!order || !user.institutionIds.includes(order.labInstitutionId)) {
    notFound();
  }

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
              <span className={`badge ${order.status === "PENDING" ? "badge-amber" : "badge-success"}`}>
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

            <div>
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
