import "server-only";
import { ERROR_STATUS, type ActionResult, type ErrorCode } from "@/contracts/shared";
import { logError } from "@/server/log";

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

export class ApiError extends Error {
  code: ErrorCode;
  details: unknown;

  constructor(code: ErrorCode, message?: string, details?: unknown) {
    super(message || DEFAULT_MESSAGES[code]);
    this.code = code;
    this.details = details;
  }
}

function errorBody(code: ErrorCode, message?: string, details?: unknown) {
  return {
    code: code,
    message: message || DEFAULT_MESSAGES[code],
    details: details,
  };
}

export function apiError(code: ErrorCode, message?: string, details?: unknown): Response {
  const body = { error: errorBody(code, message, details) };
  return Response.json(body, { status: ERROR_STATUS[code] });
}

export function actionError(code: ErrorCode, message?: string, details?: unknown): ActionResult<never> {
  return { ok: false, error: errorBody(code, message, details) };
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function handleRouteError(error: unknown): Response {
  if (error instanceof ApiError) {
    return apiError(error.code, error.message, error.details);
  }
  logError(error, "route");
  return apiError("INTERNAL");
}

export function handleActionError(error: unknown): ActionResult<never> {
  if (error instanceof ApiError) {
    return actionError(error.code, error.message, error.details);
  }
  logError(error, "action");
  return actionError("INTERNAL");
}
