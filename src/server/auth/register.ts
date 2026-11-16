import "server-only";
import bcrypt from "bcryptjs";
import type { RegistrableRole, StaffRegisterRequest } from "@/contracts/auth";
import type { InstitutionType } from "@/contracts/shared";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

// Staff self-registration (CONTRACTS §4.1). Creates an UNVERIFIED account: the person can't log in
// until an admin verifies them (Phase 7). Called by the registerStaff Server Action, which has
// already checked the input with Zod.

// Which kind of institution each role must belong to.
const INSTITUTION_TYPE_FOR_ROLE: Record<RegistrableRole, InstitutionType> = {
  DOCTOR: "HOSPITAL",
  PHARMACY: "PHARMACY",
  LAB: "LAB",
};

export async function createStaffAccount(input: StaffRegisterRequest): Promise<{ userId: string }> {
  const email = input.email.toLowerCase();

  // The institution must exist and match the role (a doctor can't join a pharmacy).
  const institution = await db.institution.findUnique({ where: { id: input.institutionId } });
  if (!institution) {
    throw new ApiError("VALIDATION_FAILED", "Choose an institution from the list.");
  }
  if (institution.type !== INSTITUTION_TYPE_FOR_ROLE[input.role]) {
    throw new ApiError("VALIDATION_FAILED", "That institution doesn't match the role you chose.");
  }

  const existing = await db.user.findUnique({ where: { email: email } });
  if (existing) {
    throw new ApiError("CONFLICT", "An account with this email already exists.");
  }

  let hprId: string | null = null;
  if (input.role === "DOCTOR" && input.hprId) {
    hprId = input.hprId;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  // User + membership in one create, so we never end up with a user who has no institution.
  const user = await db.user.create({
    data: {
      role: input.role,
      name: input.name,
      email: email,
      passwordHash: passwordHash,
      hprId: hprId,
      verified: false,
      memberships: { create: { institutionId: institution.id } },
    },
  });

  return { userId: user.id };
}
