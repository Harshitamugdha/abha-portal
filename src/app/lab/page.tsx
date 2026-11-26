import Link from "next/link";
import { redirect } from "next/navigation";
import { formatIST } from "@/contracts/format";
import type { LabOrderStatus } from "@/contracts/shared";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { listLabOrders } from "@/server/lab/list";

const LAB_LINKS = [{ href: "/lab", label: "Diagnostic Orders" }];

type PageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function LabDashboardPage({ searchParams }: PageProps) {
  const user = await getSession();
  if (!user) {
    redirect("/staff/login");
  }

  // Strict role redirection: doctors to /doctor, patients to /patient
  if (user.role === "PATIENT") {
    redirect("/patient");
  }
  if (user.role === "DOCTOR") {
    redirect("/doctor");
  }
  if (user.role !== "LAB") {
    redirect("/");
  }

  const params = await searchParams;
  const rawStatus = (params.status || "").toUpperCase();

  // Status defaults to PENDING if not specified
  let selectedFilter: "PENDING" | "COMPLETED" | "CANCELLED" | "ALL" = "PENDING";
  let queryStatus: LabOrderStatus | undefined = "PENDING";

  if (rawStatus === "ALL") {
    selectedFilter = "ALL";
    queryStatus = undefined;
  } else if (rawStatus === "COMPLETED") {
    selectedFilter = "COMPLETED";
    queryStatus = "COMPLETED";
  } else if (rawStatus === "CANCELLED") {
    selectedFilter = "CANCELLED";
    queryStatus = "CANCELLED";
  }

  const pageNum = Math.max(1, Number(params.page) || 1);

  const ordersPage = await listLabOrders(user, {
    status: queryStatus,
    page: pageNum,
    pageSize: 20,
  });

  return (
    <>
      <TopBar name={user.name} links={LAB_LINKS} />
      <main className="landing">
        <PageHead
          kicker="Laboratory portal"
          title="Diagnostic Lab Orders"
        />

        <div className="container dashboard space-y-6">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <nav className="flex gap-2" aria-label="Order status filters">
              <Link
                href="/lab?status=PENDING"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedFilter === "PENDING"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Pending Orders
              </Link>
              <Link
                href="/lab?status=COMPLETED"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedFilter === "COMPLETED"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Completed Orders
              </Link>
              <Link
                href="/lab?status=ALL"
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedFilter === "ALL"
                    ? "bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Orders
              </Link>
            </nav>

            <span className="text-xs text-gray-500 font-medium">
              Showing {ordersPage.items.length} of {ordersPage.total} orders
            </span>
          </div>

          {/* Orders Table or Empty State */}
          {ordersPage.items.length === 0 ? (
            <div className="card text-center p-12 bg-slate-50 border border-slate-200 rounded">
              <p className="text-gray-700 font-semibold mb-1">No orders found</p>
              <p className="text-sm text-gray-500">
                There are currently no {selectedFilter.toLowerCase()} diagnostic orders assigned to your laboratory.
              </p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden border border-slate-200 rounded shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Requested Tests</th>
                      <th className="px-4 py-3">Ordering Doctor</th>
                      <th className="px-4 py-3">Order Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {ordersPage.items.map((order) => {
                      const isPending = order.status === "PENDING";
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-xs text-slate-900">
                            <Link
                              href={`/lab/orders/${encodeURIComponent(order.id)}`}
                              className="text-teal-700 hover:underline"
                            >
                              {order.id}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {order.patientName}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {order.tests.map((test, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200"
                                >
                                  {test}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {order.orderedByName}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {formatIST(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`badge font-semibold text-xs ${
                                isPending
                                  ? "badge-amber"
                                  : order.status === "COMPLETED"
                                    ? "badge-success"
                                    : "badge-gray"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Link
                              href={`/lab/orders/${encodeURIComponent(order.id)}`}
                              className={`btn btn-small inline-block text-xs ${
                                isPending ? "btn-accent" : "btn-secondary"
                              }`}
                            >
                              {isPending ? "Upload result →" : "View order →"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
