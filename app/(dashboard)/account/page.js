"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/account/me");
        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      }
    };

    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Account</h1>

      {!user && <p>Not logged in.</p>}

      {user && (
        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      )}
    </div>
  );
}
