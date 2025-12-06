"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const [role, setRole] = useState("user");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/account/me");
      const data = await res.json();
      if (data.user?.role) setRole(data.user.role);
    };
    load();
  }, []);

  return (
    <div className="w-64 bg-white border-r shadow-sm p-6 space-y-6">
      <h2 className="text-xl font-semibold">Menu</h2>

      <nav className="space-y-2">
        <Link href="/dashboard" className="block hover:underline">
          Dashboard
        </Link>

        {/* Social Tools */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-1">
            Social Tools
          </h3>
          <Link href="/dashboard/social/image-generator" className="block hover:underline">
            Image Generator
          </Link>
          <Link href="/dashboard/social/logos" className="block hover:underline">
            Logo Manager
          </Link>
          <Link href="/dashboard/social/websites" className="block hover:underline">
            Website Manager
          </Link>
        </div>

        {/* Sales Tools */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-1">
            Sales
          </h3>
          <Link href="/dashboard/sales/assistant" className="block hover:underline">
            Sales Assistant
          </Link>

          {role === "admin" || role === "fi" ? (
            <Link href="/dashboard/sales/training" className="block hover:underline">
              Sales Training Upload
            </Link>
          ) : null}
        </div>

        {/* F&I Tools */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-1">
            F&amp;I
          </h3>

          <Link href="/dashboard/fi/assistant" className="block hover:underline">
            F&amp;I Assistant
          </Link>
          <Link href="/dashboard/fi/analyze" className="block hover:underline">
            Deal Analyzer
          </Link>

          {role === "admin" || role === "fi" ? (
            <>
              <Link href="/dashboard/fi/training" className="block hover:underline">
                F&amp;I Training Upload
              </Link>

              <Link href="/dashboard/fi/library" className="block hover:underline">
                Training Library
              </Link>
            </>
          ) : null}
        </div>

        {/* Account */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase text-gray-500 mb-1">
            Account
          </h3>
          <Link href="/dashboard/account" className="block hover:underline">
            My Account
          </Link>

          {/* Admin Panel - visible but protected */}
          <Link href="/dashboard/admin" className="block hover:underline text-red-600">
            Admin Panel
          </Link>
        </div>

        <a href="/logout" className="block text-gray-600 hover:underline mt-6">
          Logout
        </a>
      </nav>
    </div>
  );
}
