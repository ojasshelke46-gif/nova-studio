import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/projects/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Admin pages (not the login page) — render-time guard.
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";

  // Protected API surfaces.
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/login") &&
    !pathname.startsWith("/api/admin/logout");
  const isProjectWrite =
    pathname.startsWith("/api/projects") &&
    (method === "POST" || method === "DELETE");

  if (!isAdminPage && !isAdminApi && !isProjectWrite) {
    return NextResponse.next();
  }

  const token = req.cookies.get("nova_token")?.value;

  if (!token || !verifyToken(token)) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}
