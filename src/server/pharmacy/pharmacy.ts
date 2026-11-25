import "server-only";
import type { PharmacyPrescriptionDTO, PrescriptionItem } from "@/contracts/pharmacy";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

export async function lookupPrescription(user: SessionUser, rawShareCode: string): Promise<PharmacyPrescriptionDTO> {
  const shareCode = rawShareCode.trim().toUpperCase();

  const rx = await db.prescription.findUnique({
    where: { shareCode },
    include: {
      record: {
        include: {
          patient: { select: { id: true, name: true } },
          author: { select: { name: true } },
          institution: { select: { name: true } },
        },
      },
    },
  });

  if (!rx) {
    throw new ApiError("NOT_FOUND", "Prescription not found");
  }

  const decision = await authorize(user, "prescription:lookup", {
    kind: "prescription",
    prescription: {
      recordId: rx.recordId,
      items: rx.items,
      shareCode: rx.shareCode,
      dispensedAt: rx.dispensedAt,
      dispensedBy: rx.dispensedBy,
      expiresAt: rx.expiresAt,
      patientId: rx.record.patientId,
    },
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code, "Prescription not found");
  }

  const now = new Date();
  if (rx.expiresAt < now) {
    throw new ApiError("NOT_FOUND", "Prescription not found or expired");
  }

  const items = Array.isArray(rx.items) ? (rx.items as unknown as PrescriptionItem[]) : [];
  const issuedBy = rx.record.author?.name
    ? `${rx.record.author.name} (${rx.record.institution.name})`
    : rx.record.institution.name;

  return {
    recordId: rx.recordId,
    patientName: rx.record.patient.name,
    items,
    issuedBy,
    issuedAt: rx.record.occurredAt.toISOString(),
    dispensedAt: rx.dispensedAt ? rx.dispensedAt.toISOString() : null,
  };
}

export async function dispensePrescription(user: SessionUser, recordId: string): Promise<PharmacyPrescriptionDTO> {
  const rx = await db.prescription.findUnique({
    where: { recordId },
    include: {
      record: {
        include: {
          patient: { select: { id: true, name: true } },
          author: { select: { name: true } },
          institution: { select: { name: true } },
        },
      },
    },
  });

  if (!rx) {
    throw new ApiError("NOT_FOUND", "Prescription not found");
  }

  const decision = await authorize(user, "prescription:dispense", {
    kind: "prescription",
    prescription: {
      recordId: rx.recordId,
      items: rx.items,
      shareCode: rx.shareCode,
      dispensedAt: rx.dispensedAt,
      dispensedBy: rx.dispensedBy,
      expiresAt: rx.expiresAt,
      patientId: rx.record.patientId,
    },
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code, "You cannot dispense this prescription");
  }

  const now = new Date();
  if (rx.expiresAt < now) {
    throw new ApiError("CONFLICT", "Prescription has expired");
  }

  const updated = await db.prescription.updateMany({
    where: {
      recordId: recordId,
      dispensedAt: null,
    },
    data: {
      dispensedAt: now,
      dispensedBy: user.id,
    },
  });

  if (updated.count === 0) {
    throw new ApiError("CONFLICT", "Prescription has already been dispensed");
  }

  const items = Array.isArray(rx.items) ? (rx.items as unknown as PrescriptionItem[]) : [];
  const issuedBy = rx.record.author?.name
    ? `${rx.record.author.name} (${rx.record.institution.name})`
    : rx.record.institution.name;

  return {
    recordId: rx.recordId,
    patientName: rx.record.patient.name,
    items,
    issuedBy,
    issuedAt: rx.record.occurredAt.toISOString(),
    dispensedAt: now.toISOString(),
  };
}
