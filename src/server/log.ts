import "server-only";

export function logError(err: unknown, context?: string): void {
  const at = new Date().toISOString();
  const message = err instanceof Error ? err.message : String(err);

  const payload: Record<string, unknown> = {
    at,
    context: context || "server",
    message,
  };

  if (err instanceof Error && err.stack && process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }

  console.error(JSON.stringify(payload));
}
