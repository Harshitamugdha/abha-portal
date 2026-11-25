import "server-only";
import {
  PatientLookupDTO,
  SummaryDTO,
  type InstitutionSummary,
  type RecordTypeCount,
} from "@/contracts/clinical";
import { maskAbha, parseAbhaInput } from "@/contracts/format";
import type { RecordType, SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

export async function lookupPatient(user: SessionUser, abha: string): Promise<PatientLookupDTO> {
  // Role check must apply even when the ABHA does not exist (a patient calling it gets FORBIDDEN either way).
  if (user.role !== "DOCTOR" || !user.verified) {
    const check = await authorize(user, "patient:lookup", { kind: "none" });
    if (!check.allowed) {
      throw new ApiError(check.code);
    }
  }

  if (typeof abha !== "string" || !abha.trim()) {
    throw new ApiError("VALIDATION_FAILED", "Please enter an ABHA number or address.");
  }

  const parsed = parseAbhaInput(abha);
  if (!parsed) {
    throw new ApiError("VALIDATION_FAILED", "Invalid ABHA number or address format.");
  }

  const profile = await db.abhaProfile.findUnique({
    where:
      parsed.kind === "number"
        ? { abhaNumber: parsed.value }
        : { abhaAddress: parsed.value },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!profile || profile.user.role !== "PATIENT") {
    throw new ApiError("NOT_FOUND", "No patient found with this ABHA number or address.");
  }

  const decision = await authorize(user, "patient:lookup", {
    kind: "patient",
    patientId: profile.user.id,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  return {
    patientId: profile.user.id,
    name: profile.user.name,
    abhaNumberMasked: maskAbha(profile.abhaNumber),
  };
}

export async function getPatientHeader(user: SessionUser, patientId: string): Promise<PatientLookupDTO> {
  if (user.role !== "DOCTOR" || !user.verified) {
    const check = await authorize(user, "patient:lookup", { kind: "none" });
    if (!check.allowed) {
      throw new ApiError(check.code);
    }
  }

  if (typeof patientId !== "string" || !patientId.trim()) {
    throw new ApiError("VALIDATION_FAILED", "Patient ID is required.");
  }

  const patient = await db.user.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      name: true,
      role: true,
      abha: {
        select: {
          abhaNumber: true,
        },
      },
    },
  });

  if (!patient || patient.role !== "PATIENT" || !patient.abha) {
    throw new ApiError("NOT_FOUND", "Patient not found.");
  }

  const decision = await authorize(user, "patient:lookup", {
    kind: "patient",
    patientId: patient.id,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  return {
    patientId: patient.id,
    name: patient.name,
    abhaNumberMasked: maskAbha(patient.abha.abhaNumber),
  };
}

export async function getPatientSummary(user: SessionUser, patientId: string): Promise<SummaryDTO> {
  const decision = await authorize(user, "record:list", {
    kind: "patientRecords",
    patientId,
    types: [],
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code);
  }

  const allowedTypes = decision.allowedTypes || [];
  if (allowedTypes.length === 0) {
    return { byInstitution: [] };
  }

  const records = await db.healthRecord.findMany({
    where: {
      patientId,
      type: { in: allowedTypes },
    },
    select: {
      institutionId: true,
      type: true,
      occurredAt: true,
      institution: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
  });

  type InstAcc = {
    institutionId: string;
    institutionName: string;
    typeCounts: Map<RecordType, number>;
    latestAt: Date | null;
  };
  const map = new Map<string, InstAcc>();

  for (const rec of records) {
    let inst = map.get(rec.institutionId);
    if (!inst) {
      inst = {
        institutionId: rec.institution.id,
        institutionName: rec.institution.name,
        typeCounts: new Map<RecordType, number>(),
        latestAt: rec.occurredAt,
      };
      map.set(rec.institutionId, inst);
    }
    const current = inst.typeCounts.get(rec.type as RecordType) || 0;
    inst.typeCounts.set(rec.type as RecordType, current + 1);
    if (!inst.latestAt || rec.occurredAt > inst.latestAt) {
      inst.latestAt = rec.occurredAt;
    }
  }

  const byInstitution: InstitutionSummary[] = Array.from(map.values())
    .sort((a, b) => a.institutionName.localeCompare(b.institutionName))
    .map((inst) => {
      const counts: RecordTypeCount[] = Array.from(inst.typeCounts.entries())
        .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
        .map(([type, count]) => ({
          type,
          count,
        }));

      return {
        institutionId: inst.institutionId,
        institutionName: inst.institutionName,
        counts,
        latestAt: inst.latestAt ? inst.latestAt.toISOString() : null,
      };
    });

  return SummaryDTO.parse({ byInstitution });
}
