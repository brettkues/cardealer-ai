"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const e = document.cookie
      .split("; ")
      .find((x) => x.startsWith("email="))
      ?.split("=")[1];

    const r = document.cookie
      .split("; ")
      .find((x) => x.startsWith("role="))
      ?.split("=")[1];

    setEmail(e || "");
    setRole(r || "user");
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="mb-6">
        <p className="text-lg">
          Logged in as <strong>{email}</strong>
        </p>
        <p className="text-lg capitalize">Role: <strong>{role}</strong></p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/vehicles">Vehicle Browser</a>
        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/social">Social Generator</a>
        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/websites">Website Manager</a>
        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/logos">Logo Manager</a>
        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/assistant/sales">Sales Assistant</a>
        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/assistant/fi">F&I Assistant</a>
        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/manager/train">Training Manager</a>

        <a className="p-4 bg-gray-100 rounded shadow text-center" href="/admin">Admin Panel</a>
      </div>
    </div>
  );
}
