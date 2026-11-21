import { z } from "zod";

export const Id = z.string().min(1);

export const IsoDateTime = z.iso.datetime();

export const Role = z.enum(["PATIENT", "DOCTOR", "PHARMACY", "LAB", "ADMIN"]);
export type Role = z.infer<typeof Role>;

export const InstitutionType = z.enum(["HOSPITAL", "PHARMACY", "LAB"]);
export type InstitutionType = z.infer<typeof InstitutionType>;

export const RecordType = z.enum(["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"]);
export type RecordType = z.infer<typeof RecordType>;

export const ConsentStatus = z.enum(["REQUESTED", "GRANTED", "DENIED", "REVOKED"]);
export type ConsentStatus = z.infer<typeof ConsentStatus>;

export const ConsentDisplayStatus = z.enum(["REQUESTED", "GRANTED", "DENIED", "REVOKED", "EXPIRED"]);
export type ConsentDisplayStatus = z.infer<typeof ConsentDisplayStatus>;

export const LabOrderStatus = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);
export type LabOrderStatus = z.infer<typeof LabOrderStatus>;

export const AuditOutcome = z.enum(["ALLOWED", "DENIED"]);
export type AuditOutcome = z.infer<typeof AuditOutcome>;

export const ErrorCode = z.enum([
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "OTP_INVALID",
  "FORBIDDEN",
  "CONSENT_REQUIRED",
  "STAFF_UNVERIFIED",
  "NOT_FOUND",
  "CONFLICT",
  "FILE_TOO_LARGE",
  "RATE_LIMITED",
  "INTERNAL",
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  OTP_INVALID: 401,
  FORBIDDEN: 403,
  CONSENT_REQUIRED: 403,
  STAFF_UNVERIFIED: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FILE_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export const ApiErrorBody = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorBody["error"] };

export const SessionUser = z.object({
  id: Id,
  role: Role,
  name: z.string().min(1),
  verified: z.boolean(),
  institutionIds: z.array(Id),
  patientId: Id.optional(),
});
export type SessionUser = z.infer<typeof SessionUser>;

export const PageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type PageQuery = z.infer<typeof PageQuery>;

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
