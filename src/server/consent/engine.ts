import "server-only";
import { db } from "@/server/db";

// The consent engine. Phase 3 needs only activeGrant(); request / approve / deny / revoke are
// added in Phase 4.

// The consent that lets this doctor see this patient's records RIGHT NOW, or null.
//
// "Active" is checked inside the query, every time (D9, TRAPS §6):
//   status = GRANTED  AND  validFrom <= now  AND  now < validTo
// There is no cron job that marks consents expired. A consent whose validTo has passed simply stops
// matching this query, on the very next request. Revoked ones have status REVOKED, so they stop too.
//
// If several are active (approved more than once), we use the one that started most recently.
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
