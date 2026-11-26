import type { ReactNode } from "react";
import { DoctorQueryProvider } from "./query-provider";

export default function DoctorLayout({
  children,
  pending,
  recent,
}: {
  children: ReactNode;
  pending: ReactNode;
  recent: ReactNode;
}) {
  return (
    <DoctorQueryProvider>
      {children}
      <section className="container dashboard pt-0 pb-12" aria-label="Dashboard overview panels">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {pending}
          {recent}
        </div>
      </section>
    </DoctorQueryProvider>
  );
}
