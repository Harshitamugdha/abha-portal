import "server-only";
import type { PrescriptionItem } from "@/contracts/clinical";
import { RecordListQuery, type PrescriptionDetail, type RecordDTO } from "@/contracts/records";
import type { Page, RecordType, SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

export const recordSelect = {
  id: true,
  patientId: true,
  institutionId: true,
  authorId: true,
  type: true,
  title: true,
  summary: true,
  occurredAt: true,
  fileId: true,
  createdAt: true,
  institution: { select: { name: true } },
  author: { select: { name: true } },
  prescription: {
    select: {
      items: true,
      shareCode: true,
      dispensedAt: true,
      expiresAt: true,
    },
  },
} as const;

export type HealthRecordRow = {
  id: string;
  patientId: string;
  institutionId: string;
  authorId: string | null;
  type: RecordType;
  title: string;
  summary: string | null;
  occurredAt: Date;
  fileId: string | null;
  createdAt: Date;
  institution: { name: string };
  author: { name: string } | null;
  prescription: {
    items: unknown;
    shareCode: string;
    dispensedAt: Date | null;
    expiresAt: Date;
  } | null;
};

export function toRecordDTO(row: HealthRecordRow): RecordDTO {
  let prescription: PrescriptionDetail | null = null;
  if (row.prescription) {
    const rawItems = Array.isArray(row.prescription.items) ? row.prescription.items : [];
    const items: PrescriptionItem[] = (rawItems as Array<Record<string, unknown>>).map((it) => ({
      drug: String(it.drug || ""),
      dose: String(it.dose || ""),
      frequency: String(it.frequency || ""),
      durationDays: Number(it.durationDays) || 1,
      ...(it.notes ? { notes: String(it.notes) } : {}),
    }));

    prescription = {
      items,
      shareCode: row.prescription.shareCode,
      dispensedAt: row.prescription.dispensedAt ? row.prescription.dispensedAt.toISOString() : null,
      expiresAt: row.prescription.expiresAt.toISOString(),
    };
  }

  return {
    id: row.id,
    patientId: row.patientId,
    institutionId: row.institutionId,
    institutionName: row.institution.name,
    authorId: row.authorId,
    authorName: row.author ? row.author.name : null,
    type: row.type,
    title: row.title,
    summary: row.summary,
    occurredAt: row.occurredAt.toISOString(),
    fileId: row.fileId,
    createdAt: row.createdAt.toISOString(),
    prescription: prescription,
  };
}

export async function listPatientRecords(user: SessionUser, input: unknown): Promise<Page<RecordDTO>> {
  const q = RecordListQuery.parse(input);

  let requestedTypes: RecordType[] = [];
  if (q.types && q.types.length > 0) {
    requestedTypes = q.types;
  } else if (q.type) {
    requestedTypes = [q.type];
  }

  const decision = await authorize(user, "record:list", {
    kind: "patientRecords",
    patientId: q.patientId,
    types: requestedTypes,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  const where: {
    patientId: string;
    type: { in: RecordType[] };
    institutionId?: string;
    occurredAt?: { gte?: Date; lte?: Date };
  } = {
    patientId: q.patientId,
    type: { in: decision.allowedTypes || [] },
  };

  if (q.institutionId) {
    where.institutionId = q.institutionId;
  }

  if (q.from || q.to) {
    where.occurredAt = {};
    if (q.from) {
      where.occurredAt.gte = new Date(q.from);
    }
    if (q.to) {
      where.occurredAt.lte = new Date(q.to);
    }
  }

  const total = await db.healthRecord.count({ where });

  const rows = await db.healthRecord.findMany({
    where,
    select: recordSelect,
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    skip: (q.page - 1) * q.pageSize,
    take: q.pageSize,
  });

  return {
    items: rows.map(toRecordDTO),
    page: q.page,
    pageSize: q.pageSize,
    total: total,
  };
}

export async function listPatientInstitutions(
  user: SessionUser,
  patientId: string,
): Promise<Array<{ id: string; name: string }>> {
  const decision = await authorize(user, "record:list", {
    kind: "patientRecords",
    patientId,
    types: [],
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  const rows = await db.healthRecord.findMany({
    where: {
      patientId,
      type: { in: decision.allowedTypes || [] },
    },
    select: {
      institution: { select: { id: true, name: true } },
    },
    distinct: ["institutionId"],
  });

  return rows
    .map((r) => r.institution)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRecord(user: SessionUser, id: string): Promise<RecordDTO> {
  const minimal = await db.healthRecord.findUnique({
    where: { id },
    select: {
      id: true,
      patientId: true,
      type: true,
      authorId: true,
      institutionId: true,
    },
  });

  if (!minimal) {
    throw new ApiError("NOT_FOUND", "Record not found");
  }

  const decision = await authorize(user, "record:read", {
    kind: "record",
    record: minimal,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  const full = await db.healthRecord.findUnique({
    where: { id },
    select: recordSelect,
  });

  if (!full) {
    throw new ApiError("NOT_FOUND", "Record not found");
  }

  return toRecordDTO(full);
}
