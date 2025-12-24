"use client";

import { auth } from "@/lib/firebaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!auth.currentUser) {
      router.push("/auth/login");
      return;
    }

    const storedRole = document.cookie
      .split("; ")
      .find((x) => x.startsWith("role="))
      ?.split("=")[1];

    setRole(storedRole || "user");
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <a href="/image-generator" className="p-4 bg-gray-100 rounded shadow text-center">
          Image Generator
        </a>

        <a href="/assistant/sales" className="p-4 bg-gray-100 rounded shadow text-center">
          Sales Assistant
        </a>

        <a href="/assistant/fi" className="p-4 bg-gray-100 rounded shadow text-center">
          F&I Assistant
        </a>

        <a href="/rules" className="p-4 bg-gray-100 rounded shadow text-center">
          AI Rules & Compliance Logic
        </a>

        {(role === "admin" || role === "manager") && (
          <>
            <a href="/train" className="p-4 bg-gray-100 rounded shadow text-center">
              Train Your AI
            </a>

            <a href="/admin" className="p-4 bg-gray-100 rounded shadow text-center">
              Admin Panel
            </a>
          </>
        )}
      </div>
    </div>
  );
}
