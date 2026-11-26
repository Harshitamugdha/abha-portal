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
      <div className="container doctor-panels">
        {pending}
        {recent}
      </div>
    </DoctorQueryProvider>
  );
}
