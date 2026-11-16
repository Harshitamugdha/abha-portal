// The rules proxy.ts uses: which role may open which area of the site.
// Plain function (no Next.js, no database), so it can be tested on its own.
// No `import "server-only"`: proxy.ts imports this file (see token.ts for why).
//
// This is a COARSE gate for a nicer experience (TRAPS §1, D6). It is NOT the security check:
// every data function still calls authorize(). If this file were deleted, no data would leak;
// people would just see error pages instead of being redirected.

import { HOME_FOR_ROLE } from "@/contracts/auth";
import type { Role, SessionUser } from "@/contracts/shared";

// Each protected area and the one role allowed in it.
const AREAS: { prefix: string; role: Role }[] = [
  { prefix: "/patient", role: "PATIENT" },
  { prefix: "/doctor", role: "DOCTOR" },
  { prefix: "/lab", role: "LAB" },
  { prefix: "/pharmacy", role: "PHARMACY" },
  { prefix: "/admin", role: "ADMIN" },
];

function findArea(pathname: string) {
  for (const area of AREAS) {
    // "/lab" and "/lab/orders/1" are in the lab area; "/laboratory" is not.
    if (pathname === area.prefix || pathname.startsWith(area.prefix + "/")) {
      return area;
    }
  }
  return null;
}

// Returns where to redirect, or null to let the request through.
export function whereToRedirect(pathname: string, user: SessionUser | null): string | null {
  const area = findArea(pathname);
  if (!area) {
    return null; // public page (landing, login, institutions...)
  }

  if (!user) {
    // Patients log in with ABHA; everyone else with the staff login.
    if (area.role === "PATIENT") {
      return "/login";
    }
    return "/staff/login";
  }

  if (user.role !== area.role) {
    return HOME_FOR_ROLE[user.role]; // wrong area: send them to their own home
  }

  return null;
}
