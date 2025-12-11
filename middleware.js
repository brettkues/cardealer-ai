import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.pathname;

  const loggedIn = req.cookies.get("loggedIn")?.value === "true";
  const role = req.cookies.get("role")?.value || "user";

  if (
    url.startsWith("/auth") ||
    url === "/" ||
    url.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (!loggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (url.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
