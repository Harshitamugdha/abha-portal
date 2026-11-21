import { NextResponse, type NextRequest } from "next/server";
import { whereToRedirect } from "@/server/auth/gate";
import { SESSION_COOKIE, readSessionToken } from "@/server/auth/token";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  let user = null;
  if (token) {
    user = await readSessionToken(token);
  }

  if (!user && process.env.NODE_ENV === "development" && process.env.DEV_FAKE_USER) {
    return NextResponse.next();
  }

  const redirectTo = whereToRedirect(request.nextUrl.pathname, user);
  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/lab/:path*", "/pharmacy/:path*", "/admin/:path*"],
};
