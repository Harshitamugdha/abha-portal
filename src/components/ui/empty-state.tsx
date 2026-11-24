import type { ReactNode } from "react";

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="card text-center py-8">
      <p className="muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
