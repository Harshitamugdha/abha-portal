import Link from "next/link";
import { redirect } from "next/navigation";
import { formatIST } from "@/contracts/format";
import type { LabOrderStatus } from "@/contracts/shared";
import { PageHead } from "@/components/ui/page-head";
import { TopBar } from "@/components/ui/top-bar";
import { getSession } from "@/server/auth/session";
import { listLabOrders } from "@/server/lab/list";

const LAB_LINKS = [{ href: "/lab", label: "Lab orders" }];

const STATUS_LABELS: Record<LabOrderStatus, string> = {
  PENDING: "Waiting",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_BADGES: Record<LabOrderStatus, string> = {
  PENDING: "badge-amber",
  COMPLETED: "badge-green",
  CANCELLED: "badge-grey",
};

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
        <PageHead kicker="Laboratory" title="Lab orders" />

        <div className="container dashboard">
          <nav className="tabs" aria-label="Order status">
            <Link href="/lab?status=PENDING" className="tab" aria-current={selectedFilter === "PENDING" ? "page" : undefined}>
              Waiting for results
            </Link>
            <Link
              href="/lab?status=COMPLETED"
              className="tab"
              aria-current={selectedFilter === "COMPLETED" ? "page" : undefined}
            >
              Completed
            </Link>
            <Link href="/lab?status=ALL" className="tab" aria-current={selectedFilter === "ALL" ? "page" : undefined}>
              All orders
            </Link>
          </nav>

          {ordersPage.items.length === 0 && <p className="empty">No orders here for your lab.</p>}

          {ordersPage.items.length > 0 && (
            <div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Tests</th>
                      <th>Ordered by</th>
                      <th>Ordered on</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersPage.items.map((order) => {
                      const isPending = order.status === "PENDING";
                      return (
                        <tr key={order.id}>
                          <td>
                            <strong>{order.patientName}</strong>
                          </td>
                          <td>{order.tests.join(", ")}</td>
                          <td>{order.orderedByName}</td>
                          <td className="nowrap">{formatIST(order.createdAt)}</td>
                          <td>
                            <span className={"badge " + STATUS_BADGES[order.status]}>{STATUS_LABELS[order.status]}</span>
                          </td>
                          <td className="nowrap">
                            <Link
                              href={"/lab/orders/" + encodeURIComponent(order.id)}
                              className={isPending ? "btn btn-accent btn-small" : "btn btn-secondary btn-small"}
                            >
                              {isPending ? "Upload result" : "View"}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="table-footer muted">
                Showing {ordersPage.items.length} of {ordersPage.total} orders
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
