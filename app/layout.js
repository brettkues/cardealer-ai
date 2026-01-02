"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register") ||
    pathname.startsWith("/auth/reset");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        const snap = await getDoc(doc(db, "users", u.uid));
        const r = snap.exists() ? snap.data().role : "user";
        setRole(r);

        document.cookie = `loggedIn=true; path=/;`;
        document.cookie = `role=${r}; path=/;`;
        document.cookie = `email=${u.email}; path=/;`;
      } else {
        setUser(null);
        setRole("user");

        document.cookie = "loggedIn=false; path=/;";
        document.cookie = "role=user; path=/;";
        document.cookie = "email=; path=/;";
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push("/auth/login");
    }
  }, [loading, user, isAuthPage]);

  if (loading) return null;

  const handleLogout = async () => {
    document.cookie = "loggedIn=false; path=/;";
    document.cookie = "role=user; path=/;";
    document.cookie = "email=; path=/;";
    await signOut(auth);
    router.push("/auth/login");
  };

  return (
    <html lang="en">
      <body className="bg-gray-100 text-black">

        {!isAuthPage && user && (
          <>
            {/* TOP NAVIGATION */}
            <nav className="w-full bg-black text-white p-4 flex gap-6 text-lg font-medium">

              <Link href="/image-generator">Image Generator</Link>

              <Link href="/assistant/sales">Sales Assistant</Link>

              <Link href="/assistant/fi">F&I Assistant</Link>
          <Link href="/assistant/service">Service Assistant</Link>

              {(role === "manager" || role === "admin") && (
                <Link href="/train">Train Your AI</Link>
              )}

              {role === "admin" && (
                <Link href="/admin">Admin Panel</Link>
              )}

            </nav>

            {/* USER HEADER */}
            <header className="bg-white shadow p-4 flex justify-between items-center">
              <div>
                Logged in as: {user.email} ({role})
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Logout
              </button>
            </header>
          </>
        )}

        <div className="p-6">{children}</div>

      </body>
    </html>
  );
}
