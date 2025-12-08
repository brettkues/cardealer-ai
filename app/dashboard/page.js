"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const res = await fetch(`/api/user/${user.uid}`);
      const data = await res.json();

      setIsAdmin(data.role === "admin");
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
      <p>Select a tool from the sidebar to get started.</p>

      {isAdmin && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <p className="mt-2">Manage system settings and users.</p>
          <a
            href="/dashboard/admin"
            className="text-blue-600 underline font-semibold"
          >
            Go to Admin Page →
          </a>
        </div>
      )}
    </div>
  );
}
