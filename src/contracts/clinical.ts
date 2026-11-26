import { z } from "zod";
import { Id, IsoDateTime, RecordType } from "./shared";

export const ShareCode = z
  .string()
  .regex(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/, "Must be 6 characters from A-Z 2-9 excluding 0, O, 1, I");
export type ShareCode = z.infer<typeof ShareCode>;

export const PatientLookupDTO = z.object({
  patientId: Id,
  name: z.string().min(1),
  abhaNumberMasked: z.string().min(1),
});
export type PatientLookupDTO = z.infer<typeof PatientLookupDTO>;

export const RecordTypeCount = z.object({
  type: RecordType,
  count: z.number().int().nonnegative(),
});
export type RecordTypeCount = z.infer<typeof RecordTypeCount>;

export const InstitutionSummary = z.object({
  institutionId: Id,
  institutionName: z.string().min(1),
  counts: z.array(RecordTypeCount),
  latestAt: IsoDateTime.nullable(),
});
export type InstitutionSummary = z.infer<typeof InstitutionSummary>;

export const SummaryDTO = z.object({
  byInstitution: z.array(InstitutionSummary),
});
export type SummaryDTO = z.infer<typeof SummaryDTO>;

export const PrescriptionItem = z.object({
  drug: z.string().trim().min(1).max(100),
  dose: z.string().trim().min(1).max(50),
  frequency: z.string().trim().min(1).max(50),
  durationDays: z.coerce.number().int().min(1).max(90),
  notes: z.string().trim().max(200).optional(),
});
export type PrescriptionItem = z.infer<typeof PrescriptionItem>;

export const PrescriptionCreate = z.object({
  patientId: Id,
  institutionId: Id.optional(),
  items: z.array(PrescriptionItem).min(1, "At least one item is required").max(10, "At most 10 items allowed"),
  notes: z.string().trim().max(500).optional(),
});
export type PrescriptionCreate = z.infer<typeof PrescriptionCreate>;

export const EncounterCreate = z.object({
  patientId: Id,
  institutionId: Id.optional(),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(2000).optional(),
  occurredAt: IsoDateTime,
});
export type EncounterCreate = z.infer<typeof EncounterCreate>;

export const LabOrderCreate = z.object({
  patientId: Id,
  labInstitutionId: Id,
  tests: z.array(z.string().trim().min(1).max(100)).min(1, "At least one test required").max(10, "At most 10 tests allowed"),
});
export type LabOrderCreate = z.infer<typeof LabOrderCreate>;
