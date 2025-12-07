// /app/(dashboard)/account/page.js

"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Placeholder: replace with your real auth check
    setUser({ name: "User" });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Account</h1>
      <p>Your account details will appear here.</p>
    </div>
  );
}
