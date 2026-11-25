export type ViewerState = "loading" | "consent" | "empty" | "records" | "error";

export type ViewerError = {
  code?: string;
  message?: string;
} | null | undefined;

export type ViewerData<T = unknown> = {
  items?: T[];
} | null | undefined;

/**
 * Pure helper deciding the doctor viewer state.
 * TRAPS §4: Checks error.code === 'CONSENT_REQUIRED' BEFORE inspecting data.
 */
export function viewerState<T = unknown>(
  error: ViewerError,
  data: ViewerData<T>,
  isLoading?: boolean,
): ViewerState {
  if (error) {
    if (error.code === "CONSENT_REQUIRED") {
      return "consent";
    }
    return "error";
  }

  if (isLoading || (!data && !error)) {
    return "loading";
  }

  if (!data?.items || data.items.length === 0) {
    return "empty";
  }

  return "records";
}
