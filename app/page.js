"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-4xl font-bold mb-6">Welcome</h1>

      <p className="text-lg mb-6">
        This is your dealer platform. Choose a tool to begin.
      </p>

      <div className="space-y-4">
        <Link href="/login" className="text-blue-400 underline">
          Login
        </Link>
        <br />
        <Link href="/register" className="text-blue-400 underline">
          Register
        </Link>
        <br />
        <Link href="/dashboard" className="text-blue-400 underline">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
