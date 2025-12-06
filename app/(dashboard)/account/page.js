"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const res = await fetch("/api/account/me");
      const data = await res.json();
      setUserData(data.user || null);
    };

    loadUser();
  }, []);

  if (!userData) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">My Account</h1>

      <div className="p-4 bg-white border rounded shadow max-w-md space-y-2">
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Role:</strong> {userData.role}</p>
      </div>
    </div>
  );
}
