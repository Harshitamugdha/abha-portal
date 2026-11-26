import "server-only";
import type { InstitutionType } from "@/contracts/shared";
import { db } from "@/server/db";

export type InstitutionChoice = {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
};

export async function listInstitutionChoices(): Promise<InstitutionChoice[]> {
  const rows = await db.institution.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      city: true,
    },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    city: r.city,
  }));
}
