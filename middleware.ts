import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session/edge";

import type { SessionData } from "@/lib/session";
import { getSessionOptions } from "@/lib/session";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(`${route}/`)) return true;
  }
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/assets/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionResponse = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    sessionResponse,
    getSessionOptions(),
  );

  if (session.userId) {
    return sessionResponse;
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};
