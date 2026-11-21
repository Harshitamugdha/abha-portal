import { HOME_FOR_ROLE } from "@/contracts/auth";
import type { Role, SessionUser } from "@/contracts/shared";

const AREAS: { prefix: string; role: Role }[] = [
  { prefix: "/patient", role: "PATIENT" },
  { prefix: "/doctor", role: "DOCTOR" },
  { prefix: "/lab", role: "LAB" },
  { prefix: "/pharmacy", role: "PHARMACY" },
  { prefix: "/admin", role: "ADMIN" },
];

function findArea(pathname: string) {
  for (const area of AREAS) {
    if (pathname === area.prefix || pathname.startsWith(area.prefix + "/")) {
      return area;
    }
  }
  return null;
}

export function whereToRedirect(pathname: string, user: SessionUser | null): string | null {
  const area = findArea(pathname);
  if (!area) {
    return null;
  }

  if (!user) {
    if (area.role === "PATIENT") {
      return "/login";
    }
    return "/staff/login";
  }

  if (user.role !== area.role) {
    return HOME_FOR_ROLE[user.role];
  }

  return null;
}
