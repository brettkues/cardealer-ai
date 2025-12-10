"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid login.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-2xl mb-4">Login</h1>

      <input
        type="email"
        className="w-full p-3 border rounded mb-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="w-full p-3 border rounded mb-3"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <button
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white p-3 rounded"
      >
        Login
      </button>

      <button
        onClick={() => router.push("/auth/reset")}
        className="w-full mt-3 underline text-sm"
      >
        Forgot password?
      </button>

      <button
        onClick={() => router.push("/auth/register")}
        className="w-full mt-3 underline text-sm"
      >
        Create account
      </button>
    </div>
  );
}
