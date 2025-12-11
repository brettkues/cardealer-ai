import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.pathname;

  const loggedIn = req.cookies.get("loggedIn")?.value === "true";
  const role = req.cookies.get("role")?.value || "user";

  // Public routes
  if (
    url.startsWith("/auth") ||
    url === "/" ||
    url.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Must be logged in
  if (!loggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Admin protection
  if (url.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Manager protection
  if (url.startsWith("/manager") && !["admin", "manager"].includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|static|.*\\..*).*)",
  ],
};
