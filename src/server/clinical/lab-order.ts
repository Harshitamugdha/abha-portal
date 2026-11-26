import "server-only";
import { LabOrderCreate } from "@/contracts/clinical";
import type { LabOrderDTO } from "@/contracts/lab";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

/**
 * Creates a new lab order:
 * 1. Validates input with LabOrderCreate
 * 2. Authorizes user with action "labOrder:create" (kind: "patient")
 * 3. Validates labInstitutionId is an institution of type LAB
 * 4. Trims tests (1 to 10 tests)
 * 5. Creates LabOrder record with status PENDING
 * 6. Returns LabOrderDTO
 */
export async function writeLabOrder(
  user: SessionUser,
  input: LabOrderCreate,
): Promise<LabOrderDTO> {
  const parsed = LabOrderCreate.parse(input);

  const decision = await authorize(user, "labOrder:create", {
    kind: "patient",
    patientId: parsed.patientId,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code, decision.reason);
  }

  // Validate that labInstitutionId is of type LAB
  const lab = await db.institution.findUnique({
    where: { id: parsed.labInstitutionId },
    select: { id: true, name: true, type: true },
  });

  if (!lab || lab.type !== "LAB") {
    throw new ApiError("VALIDATION_FAILED", "The selected institution is not a laboratory.");
  }

  // Ensure tests are trimmed
  const trimmedTests = parsed.tests.map((t) => t.trim()).filter((t) => t.length > 0);
  if (trimmedTests.length === 0 || trimmedTests.length > 10) {
    throw new ApiError("VALIDATION_FAILED", "Between 1 and 10 tests are required.");
  }

  const order = await db.labOrder.create({
    data: {
      patientId: parsed.patientId,
      orderedById: user.id,
      labInstitutionId: parsed.labInstitutionId,
      tests: trimmedTests,
      status: "PENDING",
    },
    include: {
      patient: { select: { name: true } },
      orderedBy: { select: { name: true } },
      labInstitution: { select: { name: true } },
    },
  });

  return {
    id: order.id,
    patientId: order.patientId,
    patientName: order.patient.name,
    orderedById: order.orderedById,
    orderedByName: order.orderedBy.name,
    labInstitutionId: order.labInstitutionId,
    labInstitutionName: order.labInstitution.name,
    tests: order.tests,
    status: order.status,
    resultRecordId: order.resultRecordId,
    createdAt: order.createdAt.toISOString(),
  };
}
