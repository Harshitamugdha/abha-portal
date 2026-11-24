import { z } from "zod";
import { AuditOutcome, Id, InstitutionType, IsoDateTime, PageQuery, Role } from "./shared";

export const StaffDTO = z.object({
  id: Id,
  role: Role,
  name: z.string().min(1, "Name is required"),
  email: z.string().email().nullable(),
  hprId: z.string().nullable().optional(),
  verified: z.boolean(),
  createdAt: IsoDateTime,
  institutionNames: z.array(z.string()).optional(),
  institutionIds: z.array(Id),
});
export type StaffDTO = z.infer<typeof StaffDTO>;

export const ListStaffQuery = PageQuery.extend({
  verified: z.coerce.boolean().optional(),
});
export type ListStaffQuery = z.infer<typeof ListStaffQuery>;

export const VerifyStaffInput = z.object({
  userId: Id,
});
export type VerifyStaffInput = z.infer<typeof VerifyStaffInput>;

export const AuditQuery = PageQuery.extend({
  patientId: Id.optional(),
  actorId: Id.optional(),
  outcome: AuditOutcome.optional(),
  from: IsoDateTime.optional(),
  to: IsoDateTime.optional(),
});
export type AuditQuery = z.infer<typeof AuditQuery>;

export const AuditEntryDTO = z.object({
  id: Id,
  at: IsoDateTime,
  actorId: Id,
  actorRole: Role,
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().nullable().optional(),
  patientId: Id.nullable().optional(),
  outcome: AuditOutcome,
  reason: z.string().nullable().optional(),
});
export type AuditEntryDTO = z.infer<typeof AuditEntryDTO>;

export const InstitutionDTO = z.object({
  id: Id,
  name: z.string().min(1, "Name is required"),
  type: InstitutionType,
  city: z.string().min(1, "City is required"),
});
export type InstitutionDTO = z.infer<typeof InstitutionDTO>;

export const InstitutionCreate = z.object({
  name: z.string().min(1, "Name is required"),
  type: InstitutionType,
  city: z.string().min(1, "City is required"),
});
export type InstitutionCreate = z.infer<typeof InstitutionCreate>;

export const InstitutionUpdate = InstitutionCreate.extend({
  id: Id,
});
export type InstitutionUpdate = z.infer<typeof InstitutionUpdate>;
