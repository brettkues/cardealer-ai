import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "./lib/firebase";

const auth = getAuth(app);
const db = getFirestore(app);

export async function middleware(req) {
  const url = req.nextUrl.pathname;

  const session = auth.currentUser;

  // Public paths
  if (
    url.startsWith("/auth") ||
    url === "/" ||
    url.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // No session = redirect to login
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Load user role
  const userRef = doc(db, "users", session.uid);
  const snap = await getDoc(userRef);
  const role = snap.exists() ? snap.data().role : "user";

  // ADMIN ONLY ROUTES
  if (url.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // MANAGER-ONLY ROUTES
  if (url.startsWith("/manager") && role !== "admin" && role !== "manager") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}
