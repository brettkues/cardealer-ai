"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
      <nav className="space-y-3">
        <Link href="/dashboard" className="block hover:text-gray-300">
          Home
        </Link>
        <Link href="/assistant/sales" className="block hover:text-gray-300">
          Sales Assistant
        </Link>
        <Link href="/assistant/fi" className="block hover:text-gray-300">
          F&I Assistant
        </Link>
        <Link href="/image-generator" className="block hover:text-gray-300">
          Image Generator
        </Link>
        <Link href="/train" className="block hover:text-gray-300">
          Train AI
        </Link>
        <Link href="/admin" className="block hover:text-gray-300">
          Admin
        </Link>
      </nav>
    </aside>
  );
}
