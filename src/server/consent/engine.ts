import "server-only";
import { db } from "@/server/db";

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
