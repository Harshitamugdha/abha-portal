import { z } from "zod";
import { ConsentDisplayStatus, ConsentStatus, Id, IsoDateTime, PageQuery, RecordType } from "./shared";

const Scopes = z.array(RecordType).min(1, "Choose at least one record type").max(4);

export const ConsentRequest = z.object({
  patientId: Id,
  scopes: Scopes,
  purpose: z.string().trim().min(3).max(120),
  durationDays: z.coerce.number().int().min(1).max(30),
  institutionId: Id.optional(),
});
export type ConsentRequest = z.infer<typeof ConsentRequest>;

export const ConsentApprove = z.object({
  consentId: Id,
  scopes: Scopes.optional(),
});
export type ConsentApprove = z.infer<typeof ConsentApprove>;

export const ConsentIdInput = z.object({
  consentId: Id,
});
export type ConsentIdInput = z.infer<typeof ConsentIdInput>;

export const ConsentListQuery = PageQuery.extend({
  status: ConsentStatus.optional(),
});
export type ConsentListQuery = z.infer<typeof ConsentListQuery>;

export const ConsentDTO = z.object({
  id: Id,
  patientId: Id,
  patientName: z.string(),
  doctorId: Id,
  doctorName: z.string(),
  institutionId: Id,
  institutionName: z.string(),
  scopes: z.array(RecordType),
  purpose: z.string(),
  durationDays: z.number().int(),
  status: ConsentStatus,
  displayStatus: ConsentDisplayStatus,
  requestedAt: IsoDateTime,
  decidedAt: IsoDateTime.nullable(),
  validFrom: IsoDateTime.nullable(),
  validTo: IsoDateTime.nullable(),
});
export type ConsentDTO = z.infer<typeof ConsentDTO>;
