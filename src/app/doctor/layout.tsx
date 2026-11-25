import type { ReactNode } from "react";
import { DoctorQueryProvider } from "./query-provider";

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return <DoctorQueryProvider>{children}</DoctorQueryProvider>;
}
