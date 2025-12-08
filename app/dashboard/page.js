"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-4">Dashboard</h1>
      <p>Welcome {user?.email}</p>
    </div>
  );
}
