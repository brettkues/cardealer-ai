"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/account/me");
        const data = await res.json();
        setUser(data.user || null);
      } catch {
        setUser(null);
      }
    };

    loadUser();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Account</h1>

      {user ? (
        <div className="p-4 bg-white border rounded shadow">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      ) : (
        <p>Unable to load account details.</p>
      )}
    </div>
  );
}
