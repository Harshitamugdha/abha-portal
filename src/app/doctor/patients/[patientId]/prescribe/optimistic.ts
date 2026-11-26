import type { PrescriptionItem } from "@/contracts/clinical";
import type { RecordDTO } from "@/contracts/records";

export type OptimisticPrescription = RecordDTO & {
  isPending?: boolean;
};

export type PrescriptionDraft = {
  patientId: string;
  items: PrescriptionItem[];
  notes?: string;
  institutionId?: string;
  institutionName?: string;
  authorId?: string;
  authorName?: string;
};

/**
 * Pure helper that prepends a pending prescription to the list
 * without mutating the original list, maintaining an isPending flag.
 */
export function addPendingPrescription(
  list: readonly OptimisticPrescription[],
  draft: PrescriptionDraft,
): OptimisticPrescription[] {
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const titleSummary =
    draft.items && draft.items.length > 0
      ? draft.items.map((i) => i.drug).join(", ")
      : "Prescription";

  const pendingRow: OptimisticPrescription = {
    id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    patientId: draft.patientId,
    institutionId: draft.institutionId || "",
    institutionName: draft.institutionName || "This hospital",
    authorId: draft.authorId || null,
    authorName: draft.authorName || "You",
    type: "PRESCRIPTION",
    title: `Prescription: ${titleSummary}`.slice(0, 200),
    summary: draft.notes || null,
    occurredAt: nowIso,
    fileId: null,
    createdAt: nowIso,
    prescription: {
      items: draft.items,
      shareCode: "SAVING",
      dispensedAt: null,
      expiresAt: expiresIso,
    },
    isPending: true,
  };

  return [pendingRow, ...list];
}
