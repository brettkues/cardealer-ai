"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { usePathname, useRouter } from "next/navigation";

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register") ||
    pathname.startsWith("/auth/reset");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push("/auth/login");
    }
  }, [loading, user, isAuthPage, router]);

  if (loading) return null;

  return (
    <html lang="en">
      <body className="bg-gray-100 text-black">
        {!isAuthPage && user && (
          <header className="bg-white shadow p-4 flex justify-between items-center">
            <div>Logged in as: {user.email}</div>
            <button
              onClick={() => signOut(auth)}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Logout
            </button>
          </header>
        )}
        <div className="p-4">{children}</div>
      </body>
    </html>
  );
}
