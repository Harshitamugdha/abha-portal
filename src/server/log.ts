import "server-only";

export function logError(err: unknown, context?: string): void {
  const at = new Date().toISOString();
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;

  const payload = {
    at,
    context: context || "server",
    message,
    ...(stack && process.env.NODE_ENV !== "production" ? { stack } : {}),
  };

  console.error(JSON.stringify(payload));
}
