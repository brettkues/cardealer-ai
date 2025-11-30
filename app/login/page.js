"use client";

import { useState } from "react";
import { auth } from "@/app/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/ai"); // AI home page
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md border border-gray-700">

        <h1 className="text-3xl font-bold mb-6">Login</h1>

        {/* Email */}
        <label className="block mb-2">Email</label>
        <input
          type="email"
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 mb-4"
          placeholder="you@dealership.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKey}
        />

        {/* Password */}
        <label className="block mb-2">Password</label>
        <input
          type="password"
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 mb-4"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKey}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mt-2 mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Login"}
        </button>

        {/* Links */}
        <div className="flex justify-between text-sm mt-6 text-blue-400">
          <button onClick={() => router.push("/reset")}>Forgot Password?</button>
          <button onClick={() => router.push("/register")}>Create Account</button>
        </div>
      </div>
    </div>
  );
}
