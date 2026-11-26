import "server-only";
import type { InstitutionType } from "@/contracts/shared";
import { db } from "@/server/db";

export type InstitutionChoice = {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
};

export type PublicInstitutionDTO = InstitutionChoice;

export const STATIC_INSTITUTIONS: PublicInstitutionDTO[] = [
  { id: "inst-citygen", name: "City General Hospital", type: "HOSPITAL", city: "Bengaluru" },
  { id: "inst-sunrise", name: "Sunrise Multispeciality", type: "HOSPITAL", city: "Bengaluru" },
  { id: "inst-lakeside", name: "Lakeside Community Health Centre", type: "HOSPITAL", city: "Mysuru" },
  { id: "inst-greencross", name: "Green Cross Pharmacy", type: "PHARMACY", city: "Bengaluru" },
  { id: "inst-precision", name: "Precision Diagnostics Lab", type: "LAB", city: "Bengaluru" },
];

export function toPublicInstitutionDTO(inst: {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
  [key: string]: unknown;
}): PublicInstitutionDTO {
  return {
    id: inst.id,
    name: inst.name,
    type: inst.type,
    city: inst.city,
  };
}

export async function listInstitutionChoices(): Promise<InstitutionChoice[]> {
  try {
    const rows = await db.institution.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
      },
      orderBy: { name: "asc" },
    });

    return rows.map(toPublicInstitutionDTO);
  } catch {
    // Resilient fallback for offline builds / when database is down during next build
    return STATIC_INSTITUTIONS.map(toPublicInstitutionDTO);
  }
}

export async function getPublicInstitution(id: string): Promise<PublicInstitutionDTO | null> {
  try {
    const row = await db.institution.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
      },
    });

    if (!row) {
      return null;
    }

    return toPublicInstitutionDTO(row);
  } catch {
    // Resilient fallback for offline builds
    const found = STATIC_INSTITUTIONS.find((i) => i.id === id);
    return found ? toPublicInstitutionDTO(found) : null;
  }
}
