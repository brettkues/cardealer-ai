"use client";

import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!auth.currentUser) {
      router.push("/auth/login");
      return;
    }

    setEmail(auth.currentUser.email || "");
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <p className="text-lg mb-6">
        Logged in as <strong>{email}</strong>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <a href="/assistant/sales" className="block p-4 bg-gray-100 rounded shadow text-center">
          Sales Assistant
        </a>

        <a href="/assistant/fi" className="block p-4 bg-gray-100 rounded shadow text-center">
          F&I Assistant
        </a>

        <a href="/websites" className="block p-4 bg-gray-100 rounded shadow text-center">
          Website Manager
        </a>

        <a href="/logos" className="block p-4 bg-gray-100 rounded shadow text-center">
          Logo Manager
        </a>
      </div>
    </div>
  );
}
