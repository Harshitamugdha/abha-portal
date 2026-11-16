import { NextResponse, type NextRequest } from "next/server";
import { whereToRedirect } from "@/server/auth/gate";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth/token";

// Next.js 16 runs this before every matching request (it replaced middleware.ts).
// Coarse gate only (D6, TRAPS §1): logged out -> login page, wrong role -> your own home.
// It checks the cookie's signature but makes NO database calls and NO consent decisions.
// The real security check is authorize(), inside every data function.

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let user = null;
  if (token) {
    user = await readSessionToken(token);
  }

  // STUB — DELETE IN PHASE 3 together with DEV_FAKE_USER in session.ts.
  // The fake user lives in the database, which the proxy can't read, so let the request through
  // and let the page's requireSession() pick up the fake user.
  if (!user && process.env.NODE_ENV === "development" && process.env.DEV_FAKE_USER) {
    return NextResponse.next();
  }

  const redirectTo = whereToRedirect(request.nextUrl.pathname, user);
  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  return NextResponse.next();
}

// Only run for the protected areas. Public pages, /api and static files skip the proxy.
export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/lab/:path*", "/pharmacy/:path*", "/admin/:path*"],
};
