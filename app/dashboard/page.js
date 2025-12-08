"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authClient";

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await authFetch("/api/account/me");   // FIX
        const data = await res.json();

        if (data.user?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Dashboard auth error:", err);
        setIsAdmin(false);
      }
    };

    loadUser();
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
