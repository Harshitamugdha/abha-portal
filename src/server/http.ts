import "server-only";
import { ERROR_STATUS, type ActionResult, type ApiErrorBody, type ErrorCode } from "@/contracts/shared";

// The one place error responses are built (CONTRACTS §1). Never write error JSON by hand.

// A safe default message for each code. Never put a Prisma message or stack trace here.
const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: "Some of the information you sent is not valid.",
  UNAUTHENTICATED: "Please log in.",
  OTP_INVALID: "The OTP is wrong or has expired.",
  FORBIDDEN: "You are not allowed to do this.",
  CONSENT_REQUIRED: "Consent required to view this patient's records.",
  STAFF_UNVERIFIED: "Your account has not been verified by an admin yet.",
  NOT_FOUND: "Not found.",
  CONFLICT: "This has already been done.",
  FILE_TOO_LARGE: "The file is larger than 5 MB.",
  RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  INTERNAL: "Something went wrong. Please try again.",
};

// Data functions throw this when they refuse something, e.g. `throw new ApiError("NOT_FOUND")`.
// The caller (Route Handler or Server Action) catches it and turns it into a response.
export class ApiError extends Error {
  code: ErrorCode;
  details?: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.code = code;
    this.details = details;
  }
}

function buildErrorBody(code: ErrorCode, message?: string, details?: unknown): ApiErrorBody {
  return {
    error: {
      code: code,
      message: message ?? DEFAULT_MESSAGES[code],
      details: details,
    },
  };
}

// For Route Handlers: returns a Response with the right HTTP status.
//   return apiError("CONSENT_REQUIRED");   ->  403 { "error": { "code": "CONSENT_REQUIRED", ... } }
export function apiError(code: ErrorCode, message?: string, details?: unknown): Response {
  const body = buildErrorBody(code, message, details);
  return Response.json(body, { status: ERROR_STATUS[code] });
}

// For Server Actions: returns { ok: false, error } instead of throwing, so the form can show it.
//   return actionError("VALIDATION_FAILED", undefined, zodIssues);
export function actionError(code: ErrorCode, message?: string, details?: unknown): ActionResult<never> {
  const body = buildErrorBody(code, message, details);
  return { ok: false, error: body.error };
}

// Reads a request's JSON body. Returns null if the body isn't valid JSON, so Zod then reports
// VALIDATION_FAILED instead of the route crashing.
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// For the catch block of a Route Handler. An ApiError becomes its own error response; anything
// else is a bug: log it on the server and send a plain 500 (never the real message, CONTRACTS §1).
export function handleRouteError(error: unknown): Response {
  if (error instanceof ApiError) {
    return apiError(error.code, error.message, error.details);
  }
  console.error(error);
  return apiError("INTERNAL");
}

// Same idea for the catch block of a Server Action.
export function handleActionError(error: unknown): ActionResult<never> {
  if (error instanceof ApiError) {
    return actionError(error.code, error.message, error.details);
  }
  console.error(error);
  return actionError("INTERNAL");
}
