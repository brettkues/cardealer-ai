"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

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
            <nav className="w-full bg-black text-white p-4 flex gap-4">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/websites">Websites</Link>
              <Link href="/logos">Logos</Link>
              <Link href="/assistant/sales">Sales Assistant</Link>
              <Link href="/assistant/fi">F&I Assistant</Link>

              {(role === "manager" || role === "admin") && (
                <Link href="/manager/train">Training</Link>
              )}

              {role === "admin" && <Link href="/admin">Admin</Link>}
            </nav>

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

        <div className="p-4">{children}</div>
      </body>
    </html>
  );
}
