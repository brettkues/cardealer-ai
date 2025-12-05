"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    setLoading(true);

    try {
      // 1. LOGIN THROUGH FIREBASE REST API (handled inside our server route)
      const res = await fetch("/api/auth/set", {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // 2. STORE SESSION IN SECURE HTTP-ONLY COOKIE
      await fetch("/api/auth/set", {
        method: "POST",
        body: JSON.stringify({ idToken: data.idToken }),
      });

      router.push("/dashboard");
    } catch (err) {
      alert("Login error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <div className="p-10 bg-gray-800 rounded-2xl border border-gray-700 w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-lg bg-gray-700 mb-3"
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
          onClick={login}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <button
          onClick={() => router.push("/register")}
          className="w-full py-2 mt-4 text-blue-400 underline"
        >
          Create an account
        </button>
      </div>
    </div>
  );
}
