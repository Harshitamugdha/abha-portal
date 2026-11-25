import "server-only";
import { RecordListQuery } from "@/contracts/records";
import { ApiError } from "@/server/http";

function normalizeDate(val: string | null | undefined, endOfDay = false): string | undefined {
  if (!val) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return endOfDay ? `${val}T23:59:59.999Z` : `${val}T00:00:00.000Z`;
  }
  return val;
}

export function parseRecordListParams(
  patientId: string,
  searchParams: URLSearchParams | URL | Record<string, string | string[] | undefined>,
): RecordListQuery {
  let rawTypes: string[] = [];
  let institutionId: string | undefined;
  let rawFrom: string | undefined;
  let rawTo: string | undefined;
  let rawPage: unknown;
  let rawPageSize: unknown;

  if (searchParams instanceof URL) {
    const sp = searchParams.searchParams;
    rawTypes = sp.getAll("type");
    institutionId = sp.get("institutionId") || undefined;
    rawFrom = sp.get("from") || undefined;
    rawTo = sp.get("to") || undefined;
    rawPage = sp.get("page") || undefined;
    rawPageSize = sp.get("pageSize") || undefined;
  } else if (searchParams instanceof URLSearchParams) {
    rawTypes = searchParams.getAll("type");
    institutionId = searchParams.get("institutionId") || undefined;
    rawFrom = searchParams.get("from") || undefined;
    rawTo = searchParams.get("to") || undefined;
    rawPage = searchParams.get("page") || undefined;
    rawPageSize = searchParams.get("pageSize") || undefined;
  } else {
    const t = searchParams.type;
    if (Array.isArray(t)) {
      rawTypes = t;
    } else if (typeof t === "string") {
      rawTypes = [t];
    } else if (Array.isArray(searchParams.types)) {
      rawTypes = searchParams.types;
    }
    institutionId = typeof searchParams.institutionId === "string" ? searchParams.institutionId : undefined;
    rawFrom = typeof searchParams.from === "string" ? searchParams.from : undefined;
    rawTo = typeof searchParams.to === "string" ? searchParams.to : undefined;
    rawPage = searchParams.page;
    rawPageSize = searchParams.pageSize;
  }

  const input: Record<string, unknown> = {
    patientId,
  };

  if (rawTypes.length > 1) {
    input.types = rawTypes;
  } else if (rawTypes.length === 1) {
    input.type = rawTypes[0];
    input.types = [rawTypes[0]];
  }

  if (institutionId) {
    input.institutionId = institutionId;
  }

  if (rawFrom) {
    input.from = normalizeDate(rawFrom, false);
  }

  if (rawTo) {
    input.to = normalizeDate(rawTo, true);
  }

  if (rawPage !== undefined && rawPage !== null && rawPage !== "") {
    input.page = rawPage;
  }

  if (rawPageSize !== undefined && rawPageSize !== null && rawPageSize !== "") {
    input.pageSize = rawPageSize;
  }

  const result = RecordListQuery.safeParse(input);
  if (!result.success) {
    throw new ApiError("VALIDATION_FAILED", "Invalid query parameters", result.error.issues);
  }

  return result.data;
}
