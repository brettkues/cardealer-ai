import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  const loggedIn = req.cookies.get("loggedIn")?.value === "true";
  const role = req.cookies.get("role")?.value || "user";

  // Public routes
  if (
    path.startsWith("/auth") ||
    path === "/" ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Require login
  if (!loggedIn) {
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // Admin only
  if (path.startsWith("/admin") && role !== "admin") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Manager only
  if (
    path.startsWith("/manager") &&
    role !== "admin" &&
    role !== "manager"
  ) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
