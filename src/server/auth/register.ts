import "server-only";
import bcrypt from "bcryptjs";
import type { StaffRegisterRequest } from "@/contracts/auth";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

const INSTITUTION_TYPE_FOR_ROLE = {
  DOCTOR: "HOSPITAL",
  PHARMACY: "PHARMACY",
  LAB: "LAB",
};

export async function createStaffAccount(input: StaffRegisterRequest) {
  const email = input.email.toLowerCase();

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

  let hprId = null;
  if (input.role === "DOCTOR") {
    hprId = input.hprId;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  let user;
  try {
    user = await db.user.create({
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
  } catch (error) {
    if (isEmailTaken(error)) {
      throw new ApiError("CONFLICT", "An account with this email already exists.");
    }
    throw error;
  }

  return { userId: user.id };
}

function isEmailTaken(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if (!("code" in error)) {
    return false;
  }
  return error.code === "P2002";
}

export async function listInstitutionsForRegistration() {
  return db.institution.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });
}
