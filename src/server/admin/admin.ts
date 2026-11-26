import "server-only";
import { z } from "zod";
import {
  AuditQuery,
  InstitutionCreate,
  InstitutionUpdate,
  ListStaffQuery,
  type AuditEntryDTO,
  type InstitutionDTO,
  type StaffDTO,
} from "@/contracts/admin";
import type { AuditOutcome, Page, Role, SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

export async function listStaff(
  user: SessionUser,
  rawQuery?: Partial<z.input<typeof ListStaffQuery>>,
): Promise<Page<StaffDTO>> {
  const decision = await authorize(user, "staff:verify", { kind: "none" });
  if (!decision.allowed) {
    throw new ApiError(decision.code, "Admin access required");
  }

  const query = ListStaffQuery.parse(rawQuery || {});
  const page = query.page;
  const pageSize = query.pageSize;
  const skip = (page - 1) * pageSize;

  const staffRoles: Role[] = ["DOCTOR", "PHARMACY", "LAB"];
  const where: { role: { in: Role[] }; verified?: boolean } = {
    role: { in: staffRoles },
  };
  if (query.verified !== undefined) {
    where.verified = query.verified;
  }

  const total = await db.user.count({ where });
  const users = await db.user.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: {
          institution: true,
        },
      },
    },
  });

  const items: StaffDTO[] = users.map((u) => ({
    id: u.id,
    role: u.role,
    name: u.name,
    email: u.email,
    hprId: u.hprId,
    verified: u.verified,
    createdAt: u.createdAt.toISOString(),
    institutionNames: u.memberships.map((m) => m.institution.name),
    institutionIds: u.memberships.map((m) => m.institutionId),
  }));

  return {
    items,
    page,
    pageSize,
    total,
  };
}

export async function verifyStaff(user: SessionUser, userId: string): Promise<StaffDTO> {
  const decision = await authorize(user, "staff:verify", { kind: "none" });
  if (!decision.allowed) {
    throw new ApiError(decision.code, "Admin access required");
  }

  const existing = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          institution: true,
        },
      },
    },
  });

  if (!existing) {
    throw new ApiError("NOT_FOUND", "Staff member not found");
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { verified: true },
    include: {
      memberships: {
        include: {
          institution: true,
        },
      },
    },
  });

  return {
    id: updated.id,
    role: updated.role,
    name: updated.name,
    email: updated.email,
    hprId: updated.hprId,
    verified: updated.verified,
    createdAt: updated.createdAt.toISOString(),
    institutionNames: updated.memberships.map((m) => m.institution.name),
    institutionIds: updated.memberships.map((m) => m.institutionId),
  };
}

export async function queryAudit(
  user: SessionUser,
  rawQuery?: Partial<z.input<typeof AuditQuery>>,
): Promise<Page<AuditEntryDTO>> {
  const decision = await authorize(user, "audit:read:all", { kind: "none" });
  if (!decision.allowed) {
    throw new ApiError(decision.code, "Admin access required");
  }

  const query = AuditQuery.parse(rawQuery || {});
  const page = query.page;
  const pageSize = query.pageSize;
  const skip = (page - 1) * pageSize;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (query.from) {
    dateFilter.gte = new Date(query.from);
  }
  if (query.to) {
    dateFilter.lte = new Date(query.to);
  }

  const where: {
    patientId?: string;
    actorId?: string;
    outcome?: AuditOutcome;
    at?: { gte?: Date; lte?: Date };
  } = {};

  if (query.patientId) {
    where.patientId = query.patientId;
  }
  if (query.actorId) {
    where.actorId = query.actorId;
  }
  if (query.outcome) {
    where.outcome = query.outcome;
  }
  if (query.from || query.to) {
    where.at = dateFilter;
  }

  const total = await db.auditLog.count({ where });
  const rows = await db.auditLog.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: { at: "desc" },
  });

  const items: AuditEntryDTO[] = rows.map((r) => ({
    id: r.id,
    at: r.at.toISOString(),
    actorId: r.actorId,
    actorRole: r.actorRole,
    action: r.action,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    patientId: r.patientId,
    outcome: r.outcome,
    reason: r.reason,
  }));

  return {
    items,
    page,
    pageSize,
    total,
  };
}

export async function listInstitutions(user: SessionUser): Promise<InstitutionDTO[]> {
  const decision = await authorize(user, "institution:manage", { kind: "none" });
  if (!decision.allowed) {
    throw new ApiError(decision.code, "Admin access required");
  }

  const rows = await db.institution.findMany({
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    city: row.city,
  }));
}

export async function createInstitution(user: SessionUser, input: InstitutionCreate): Promise<InstitutionDTO> {
  const decision = await authorize(user, "institution:manage", { kind: "none" });
  if (!decision.allowed) {
    throw new ApiError(decision.code, "Admin access required");
  }

  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
  const id = `inst-${slug}-${Date.now().toString(36)}`;

  const created = await db.institution.create({
    data: {
      id,
      name: input.name.trim(),
      type: input.type,
      city: input.city.trim(),
    },
  });

  return {
    id: created.id,
    name: created.name,
    type: created.type,
    city: created.city,
  };
}

export async function updateInstitution(user: SessionUser, input: InstitutionUpdate): Promise<InstitutionDTO> {
  const decision = await authorize(user, "institution:manage", { kind: "none" });
  if (!decision.allowed) {
    throw new ApiError(decision.code, "Admin access required");
  }

  const existing = await db.institution.findUnique({
    where: { id: input.id },
  });

  if (!existing) {
    throw new ApiError("NOT_FOUND", "Institution not found");
  }

  const updated = await db.institution.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      type: input.type,
      city: input.city.trim(),
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    type: updated.type,
    city: updated.city,
  };
}
