import "server-only";
import { type LabOrderDTO, LabOrderListQuery } from "@/contracts/lab";
import type { Page, SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

/**
 * Lists diagnostic lab orders for staff belonging to the fulfilling laboratory.
 *
 * Privacy & Security Guarantees:
 * - Authorizes with action "labOrder:list:lab" (kind: "none")
 * - Scoped strictly to session user's institutionIds (never taken from request parameters)
 * - Returns minimal patient details: patient name only; NO ABHA number, DOB, or gender
 */
export async function listLabOrders(
  user: SessionUser,
  input: unknown,
): Promise<Page<LabOrderDTO>> {
  const decision = await authorize(user, "labOrder:list:lab", { kind: "none" });
  if (!decision.allowed) {
    throw new ApiError(decision.code, decision.reason);
  }

  const q = LabOrderListQuery.parse(input || {});

  // If lab staff has no associated institution, immediately return empty results
  if (!user.institutionIds || user.institutionIds.length === 0) {
    return {
      items: [],
      page: q.page,
      pageSize: q.pageSize,
      total: 0,
    };
  }

  const where: {
    labInstitutionId: { in: string[] };
    status?: typeof q.status;
  } = {
    labInstitutionId: { in: user.institutionIds },
  };

  if (q.status) {
    where.status = q.status;
  }

  const [rows, total] = await Promise.all([
    db.labOrder.findMany({
      where,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        patientId: true,
        orderedById: true,
        labInstitutionId: true,
        tests: true,
        status: true,
        resultRecordId: true,
        createdAt: true,
        patient: {
          select: {
            name: true,
          },
        },
        orderedBy: {
          select: {
            name: true,
          },
        },
        labInstitution: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.labOrder.count({ where }),
  ]);

  const items: LabOrderDTO[] = rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    patientName: r.patient.name,
    orderedById: r.orderedById,
    orderedByName: r.orderedBy.name,
    labInstitutionId: r.labInstitutionId,
    labInstitutionName: r.labInstitution.name,
    tests: r.tests,
    status: r.status,
    resultRecordId: r.resultRecordId,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    items,
    page: q.page,
    pageSize: q.pageSize,
    total,
  };
}
