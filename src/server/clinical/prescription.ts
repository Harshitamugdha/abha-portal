import "server-only";
import { randomInt } from "node:crypto";
import { PrescriptionCreate } from "@/contracts/clinical";
import type { SessionUser } from "@/contracts/shared";
import { authorize } from "@/server/auth/authorize";
import { db } from "@/server/db";
import { ApiError } from "@/server/http";

export const SHARE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_SHARE_CODE_RETRIES = 5;

/**
 * Generates a 6-character share code using characters from
 * ABCDEFGHJKLMNPQRSTUVWXYZ23456789 via crypto.randomInt (not Math.random).
 */
export function generateShareCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = randomInt(0, SHARE_CODE_CHARS.length);
    code += SHARE_CODE_CHARS[idx];
  }
  return code;
}

export type WritePrescriptionResult = {
  recordId: string;
  shareCode: string;
};
export type PrescriptionResult = WritePrescriptionResult;

/**
 * Writes a prescription for a patient:
 * 1. Validates input with Zod PrescriptionCreate
 * 2. Authorizes doctor with action "record:create:clinical" (kind: "patient")
 * 3. Creates HealthRecord (PRESCRIPTION) and Prescription within a transaction
 * 4. Retries up to 5 times outside failed transaction on Prisma P2002 unique constraint error
 */
export async function writePrescription(
  user: SessionUser,
  input: PrescriptionCreate,
): Promise<PrescriptionResult> {
  const parsed = PrescriptionCreate.parse(input);

  const decision = await authorize(user, "record:create:clinical", {
    kind: "patient",
    patientId: parsed.patientId,
  });

  if (!decision.allowed) {
    throw new ApiError(decision.code, decision.reason);
  }

  // Determine institution: single institution doctor automatically takes their institution
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

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const drugSummary = parsed.items.map((i) => i.drug).join(", ");
  const title = `Prescription: ${drugSummary}`.slice(0, 200);

  for (let attempt = 1; attempt <= MAX_SHARE_CODE_RETRIES; attempt++) {
    const shareCode = generateShareCode();

    try {
      const result = await db.$transaction(async (tx) => {
        const record = await tx.healthRecord.create({
          data: {
            patientId: parsed.patientId,
            institutionId,
            authorId: user.id,
            type: "PRESCRIPTION",
            title,
            summary: parsed.notes || null,
            occurredAt: now,
          },
        });

        const rx = await tx.prescription.create({
          data: {
            recordId: record.id,
            items: parsed.items,
            shareCode,
            expiresAt,
          },
        });

        return {
          recordId: record.id,
          shareCode: rx.shareCode,
        };
      });

      return result;
    } catch (err: unknown) {
      const isP2002 =
        Boolean(err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002");

      if (isP2002) {
        if (attempt === MAX_SHARE_CODE_RETRIES) {
          throw new ApiError(
            "INTERNAL",
            `Failed to generate a unique share code after ${MAX_SHARE_CODE_RETRIES} attempts.`,
          );
        }
        // Unique code collision: retry with a new code outside the failed transaction
        continue;
      }

      // Non-unique constraint errors: re-throw immediately
      throw err;
    }
  }

  throw new ApiError(
    "INTERNAL",
    `Failed to generate a unique share code after ${MAX_SHARE_CODE_RETRIES} attempts.`,
  );
}
