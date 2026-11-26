import "server-only";
import { EncounterCreate } from "@/contracts/clinical";
import type { RecordDTO } from "@/contracts/records";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";
import { toRecordDTO } from "@/server/records/list";

/**
 * Creates a new clinical encounter visit record:
 * 1. Validates input with EncounterCreate
 * 2. Authorizes doctor with action "record:create:clinical" (kind: "patient")
 * 3. Assigns institution (single-institution doctor defaults to their institution)
 * 4. Creates HealthRecord (type: "ENCOUNTER")
 * 5. Returns RecordDTO
 */
export async function writeEncounter(
  user: SessionUser,
  input: EncounterCreate,
): Promise<RecordDTO> {
  const parsed = EncounterCreate.parse(input);

  const decision = await authorize(user, "record:create:clinical", {
    kind: "patient",
    patientId: parsed.patientId,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code, decision.reason);
  }

  // Determine institution
  let institutionId: string;
  if (user.institutionIds.length === 1) {
    institutionId = user.institutionIds[0];
  } else if (parsed.institutionId && user.institutionIds.includes(parsed.institutionId)) {
    institutionId = parsed.institutionId;
  } else if (user.institutionIds.length > 1) {
    throw new ApiError("VALIDATION_FAILED", "Please select an institution.");
  } else {
    throw new ApiError("FORBIDDEN", "Doctor does not belong to any institution.");
  }

  const occurredAt = new Date(parsed.occurredAt);

  const record = await db.healthRecord.create({
    data: {
      patientId: parsed.patientId,
      institutionId,
      authorId: user.id,
      type: "ENCOUNTER",
      title: parsed.title.trim(),
      summary: parsed.summary ? parsed.summary.trim() : null,
      occurredAt,
    },
    include: {
      institution: { select: { name: true } },
      author: { select: { name: true } },
      prescription: true,
    },
  });

  return toRecordDTO(record);
}
