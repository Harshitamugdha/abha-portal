// Shapes shared by the whole app (CONTRACTS §0, §1, §5).
// This folder is imported by server code AND browser code, so: Zod and plain TypeScript only.
// No Prisma, no next/*, nothing from src/server/.

import { z } from "zod";

// ---------- Basic building blocks ----------

// Ids are plain strings: new rows get a cuid, seeded rows have readable ids like "user-asha".
export const Id = z.string().min(1);

// Timestamps in the API are ISO 8601 in UTC with a trailing "Z", e.g. "2026-10-21T09:30:00.000Z".
export const IsoDateTime = z.iso.datetime();

// ---------- Enums (same values as prisma/schema.prisma) ----------

export const Role = z.enum(["PATIENT", "DOCTOR", "PHARMACY", "LAB", "ADMIN"]);
export type Role = z.infer<typeof Role>;

export const InstitutionType = z.enum(["HOSPITAL", "PHARMACY", "LAB"]);
export type InstitutionType = z.infer<typeof InstitutionType>;

export const RecordType = z.enum(["ENCOUNTER", "PRESCRIPTION", "LAB_REPORT", "DOCUMENT"]);
export type RecordType = z.infer<typeof RecordType>;

// What is stored in the database. EXPIRED is never stored (D9).
export const ConsentStatus = z.enum(["REQUESTED", "GRANTED", "DENIED", "REVOKED"]);
export type ConsentStatus = z.infer<typeof ConsentStatus>;

// What the screens show. EXPIRED = GRANTED but validTo has passed (worked out on the server).
export const ConsentDisplayStatus = z.enum(["REQUESTED", "GRANTED", "DENIED", "REVOKED", "EXPIRED"]);
export type ConsentDisplayStatus = z.infer<typeof ConsentDisplayStatus>;

export const LabOrderStatus = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);
export type LabOrderStatus = z.infer<typeof LabOrderStatus>;

export const AuditOutcome = z.enum(["ALLOWED", "DENIED"]);
export type AuditOutcome = z.infer<typeof AuditOutcome>;

// ---------- Errors (CONTRACTS §1) ----------

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

// The HTTP status for each error code. Same table as CONTRACTS §1.
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

// The one error shape: { "error": { "code": "...", "message": "...", "details": ... } }
export const ApiErrorBody = z.object({
  error: z.object({
    code: ErrorCode,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;

// What every Server Action returns. Actions never throw to the browser, so a form can show
// the error next to the right field.
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorBody["error"] };

// ---------- Session (CONTRACTS §5) ----------

export const SessionUser = z.object({
  id: Id,
  role: Role,
  name: z.string().min(1),
  verified: z.boolean(),
  institutionIds: z.array(Id), // staff; [] for patients
  patientId: Id.optional(), // patients only: same as id
});
export type SessionUser = z.infer<typeof SessionUser>;

// ---------- Pagination (CONTRACTS §0, D17) ----------

// Query string ?page=1&pageSize=20. Values arrive as strings, so z.coerce turns them into numbers.
export const PageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type PageQuery = z.infer<typeof PageQuery>;

// Every list response: { items, page, pageSize, total }.
export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// Builds the Zod schema for a Page of some item, e.g. pageOf(RecordDTO).
export function pageOf<Item extends z.ZodType>(item: Item) {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(50),
    total: z.number().int().min(0),
  });
}
