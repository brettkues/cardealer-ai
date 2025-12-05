"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    if (!email || !password) {
      alert("Email and password required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/set", {
        method: "POST",
        body: JSON.stringify({
          action: "register",
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Registration failed");
      } else {
        alert("Account created! Please log in.");
        router.push("/login");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <div className="p-10 bg-gray-800 rounded-2xl border border-gray-700 w-96">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-lg bg-gray-700 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded-lg bg-gray-700 mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={register}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
        >
          {loading ? "Creating…" : "Create Account"}
        </button>
      </div>
    </div>
  );
}
