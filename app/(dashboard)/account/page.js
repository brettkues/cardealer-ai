export const dynamic = "force-dynamic";

"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/account/me");
      const data = await res.json();
      setUser(data.user || null);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Account</h1>

      {!user && <p>Loading…</p>}

      {user && (
        <div className="p-4 border rounded bg-white shadow">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>User ID:</strong> {user.uid}</p>
        </div>
      )}
    </div>
  );
}
