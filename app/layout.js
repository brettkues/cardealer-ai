"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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

        // Load role from Firestore
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setRole(snap.data().role || "user");
        } else {
          setRole("user");
        }
      } else {
        setUser(null);
        setRole("user");
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

  return (
    <html lang="en">
      <body className="bg-gray-100 text-black">
        {!isAuthPage && user && (
          <header className="bg-white shadow p-4 flex justify-between items-center">
            <div>
              Logged in as: {user.email} ({role})
            </div>

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
