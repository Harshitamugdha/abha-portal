import "server-only";
import type { ConsentApprove, ConsentDTO, ConsentListQuery, ConsentRequest } from "@/contracts/consent";
import type { ConsentStatus, Page, SessionUser } from "@/contracts/shared";
import type { ConsentGrant } from "@/generated/prisma/client";
import { authorize, type Decision } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { addDays, chooseInstitution, displayStatus, narrowScopes } from "./rules";

const withNames = {
  patient: { select: { name: true } },
  doctor: { select: { name: true } },
  institution: { select: { name: true } },
};

type ConsentRow = ConsentGrant & {
  patient: { name: string };
  doctor: { name: string };
  institution: { name: string };
};

function isoOrNull(date: Date | null) {
  if (date) {
    return date.toISOString();
  }
  return null;
}

function toConsentDTO(row: ConsentRow, now: Date): ConsentDTO {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patient.name,
    doctorId: row.doctorId,
    doctorName: row.doctor.name,
    institutionId: row.institutionId,
    institutionName: row.institution.name,
    scopes: row.scopes,
    purpose: row.purpose,
    durationDays: row.durationDays,
    status: row.status,
    displayStatus: displayStatus(row.status, row.validTo, now),
    requestedAt: row.requestedAt.toISOString(),
    decidedAt: isoOrNull(row.decidedAt),
    validFrom: isoOrNull(row.validFrom),
    validTo: isoOrNull(row.validTo),
  };
}

function throwIfDenied(decision: Decision) {
  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }
}

async function loadConsent(consentId: string) {
  const consent = await db.consentGrant.findUnique({ where: { id: consentId }, include: withNames });
  if (!consent) {
    throw new ApiError("NOT_FOUND");
  }
  return consent;
}

async function loadOwnConsent(user: SessionUser, consentId: string) {
  const consent = await loadConsent(consentId);
  const decision = await authorize(user, "consent:decide", { kind: "consent", consent: consent });
  throwIfDenied(decision);
  return consent;
}

export async function activeGrant(patientId: string, doctorId: string, now: Date) {
  return db.consentGrant.findFirst({
    where: {
      patientId: patientId,
      doctorId: doctorId,
      status: "GRANTED",
      validFrom: { lte: now },
      validTo: { gt: now },
    },
    orderBy: { validFrom: "desc" },
  });
}

export async function createRequest(user: SessionUser, input: ConsentRequest): Promise<ConsentDTO> {
  const decision = await authorize(user, "consent:request", { kind: "patient", patientId: input.patientId });
  throwIfDenied(decision);

  const patient = await db.user.findUnique({ where: { id: input.patientId } });
  if (!patient || patient.role !== "PATIENT") {
    throw new ApiError("NOT_FOUND");
  }

  const institutionId = chooseInstitution(user.institutionIds, input.institutionId);
  if (!institutionId) {
    throw new ApiError("VALIDATION_FAILED", "Choose the institution you are requesting for.");
  }

  const open = await db.consentGrant.findFirst({
    where: { patientId: input.patientId, doctorId: user.id, status: "REQUESTED" },
    include: withNames,
  });
  if (open) {
    return toConsentDTO(open, new Date());
  }

  const created = await db.consentGrant.create({
    data: {
      patientId: input.patientId,
      doctorId: user.id,
      institutionId: institutionId,
      scopes: input.scopes,
      purpose: input.purpose,
      durationDays: input.durationDays,
    },
    include: withNames,
  });
  return toConsentDTO(created, new Date());
}

export async function approveRequest(user: SessionUser, input: ConsentApprove): Promise<ConsentDTO> {
  const consent = await loadOwnConsent(user, input.consentId);
  if (consent.status !== "REQUESTED") {
    throw new ApiError("CONFLICT", "This request has already been answered.");
  }

  let scopes = consent.scopes;
  if (input.scopes) {
    scopes = narrowScopes(consent.scopes, input.scopes);
    if (scopes.length === 0) {
      throw new ApiError("VALIDATION_FAILED", "Choose at least one of the requested record types.");
    }
  }

  const now = new Date();
  const result = await db.consentGrant.updateMany({
    where: { id: consent.id, status: "REQUESTED" },
    data: {
      status: "GRANTED",
      scopes: scopes,
      decidedAt: now,
      validFrom: now,
      validTo: addDays(now, consent.durationDays),
    },
  });
  if (result.count === 0) {
    throw new ApiError("CONFLICT", "This request has already been answered.");
  }

  const updated = await loadConsent(consent.id);
  return toConsentDTO(updated, now);
}

export async function denyRequest(user: SessionUser, consentId: string): Promise<ConsentDTO> {
  const consent = await loadOwnConsent(user, consentId);
  if (consent.status !== "REQUESTED") {
    throw new ApiError("CONFLICT", "This request has already been answered.");
  }

  const now = new Date();
  const result = await db.consentGrant.updateMany({
    where: { id: consent.id, status: "REQUESTED" },
    data: { status: "DENIED", decidedAt: now },
  });
  if (result.count === 0) {
    throw new ApiError("CONFLICT", "This request has already been answered.");
  }

  const updated = await loadConsent(consent.id);
  return toConsentDTO(updated, now);
}

export async function revokeGrant(user: SessionUser, consentId: string): Promise<ConsentDTO> {
  const consent = await loadOwnConsent(user, consentId);
  if (consent.status !== "GRANTED") {
    throw new ApiError("CONFLICT", "Only an approved consent can be revoked.");
  }

  const result = await db.consentGrant.updateMany({
    where: { id: consent.id, status: "GRANTED" },
    data: { status: "REVOKED" },
  });
  if (result.count === 0) {
    throw new ApiError("CONFLICT", "Only an approved consent can be revoked.");
  }

  const updated = await loadConsent(consent.id);
  return toConsentDTO(updated, new Date());
}

export async function listConsents(user: SessionUser, query: ConsentListQuery): Promise<Page<ConsentDTO>> {
  const where: { patientId?: string; doctorId?: string; status?: ConsentStatus } = {};

  let decision;
  if (user.role === "PATIENT") {
    decision = await authorize(user, "consent:list", { kind: "patient", patientId: user.id });
    where.patientId = user.id;
  } else {
    decision = await authorize(user, "consent:list", { kind: "none" });
    where.doctorId = user.id;
  }
  throwIfDenied(decision);

  if (query.status) {
    where.status = query.status;
  }

  const total = await db.consentGrant.count({ where: where });
  const rows = await db.consentGrant.findMany({
    where: where,
    include: withNames,
    orderBy: { requestedAt: "desc" },
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });

  const now = new Date();
  const items: ConsentDTO[] = [];
  for (const row of rows) {
    items.push(toConsentDTO(row, now));
  }

  return { items: items, page: query.page, pageSize: query.pageSize, total: total };
}

export async function latestConsent(user: SessionUser, patientId: string): Promise<ConsentDTO | null> {
  const decision = await authorize(user, "consent:list", { kind: "patient", patientId: patientId });
  throwIfDenied(decision);

  const row = await db.consentGrant.findFirst({
    where: { patientId: patientId, doctorId: user.id },
    include: withNames,
    orderBy: { requestedAt: "desc" },
  });
  if (!row) {
    return null;
  }
  return toConsentDTO(row, new Date());
}
