import { z } from "zod";
import { Id, IsoDateTime } from "./shared";

export const PrescriptionItem = z.object({
  drug: z.string().min(1, "Drug name is required"),
  dose: z.string().min(1, "Dose is required"),
  frequency: z.string().min(1, "Frequency is required"),
  durationDays: z.number().int().positive("Duration must be positive"),
  notes: z.string().optional(),
});
export type PrescriptionItem = z.infer<typeof PrescriptionItem>;

export const PharmacyPrescriptionDTO = z.object({
  recordId: Id,
  patientName: z.string().min(1, "Patient name is required"),
  items: z.array(PrescriptionItem).min(1, "At least one item required").max(10),
  issuedBy: z.string().min(1, "Issuer is required"),
  issuedAt: IsoDateTime,
  dispensedAt: IsoDateTime.nullable(),
});
export type PharmacyPrescriptionDTO = z.infer<typeof PharmacyPrescriptionDTO>;

export const DispensePrescriptionInput = z.object({
  recordId: Id,
});
export type DispensePrescriptionInput = z.infer<typeof DispensePrescriptionInput>;
