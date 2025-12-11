"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split("; ").reduce((acc, item) => {
      const [key, value] = item.split("=");
      acc[key] = value;
      return acc;
    }, {});

    setEmail(cookies["email"] || "Unknown");
    setRole(cookies["role"] || "user");
  }, []);

  const logout = () => {
    document.cookie = "loggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/auth/login");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      <p className="mb-2"><strong>Logged in as:</strong> {email}</p>
      <p className="mb-6"><strong>Role:</strong> {role}</p>

      <div className="grid grid-cols-1 gap-4">

        <button onClick={() => router.push("/websites")}
          className="w-full bg-blue-600 text-white p-3 rounded">
          Website Manager
        </button>

        <button onClick={() => router.push("/logos")}
          className="w-full bg-purple-600 text-white p-3 rounded">
          Logo Manager
        </button>

        <button onClick={() => router.push("/assistant/sales")}
          className="w-full bg-green-600 text-white p-3 rounded">
          Sales Assistant
        </button>

        <button onClick={() => router.push("/assistant/fi")}
          className="w-full bg-teal-600 text-white p-3 rounded">
          F&I Assistant
        </button>

        {(role === "manager" || role === "admin") && (
          <button onClick={() => router.push("/manager/train")}
            className="w-full bg-yellow-600 text-white p-3 rounded">
            Training Manager
          </button>
        )}

        {role === "admin" && (
          <button onClick={() => router.push("/admin")}
            className="w-full bg-red-600 text-white p-3 rounded">
            Admin Panel
          </button>
        )}

        <button onClick={logout}
          className="w-full bg-gray-700 text-white p-3 rounded">
          Logout
        </button>

      </div>
    </div>
  );
}
