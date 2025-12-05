"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword
} from "firebase/auth";

// Firebase client config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) initializeApp(firebaseConfig);

const auth = getAuth();

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Firebase client login
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();

      // Store ID token in HttpOnly cookie on the server
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        alert("Server login failed.");
        setLoading(false);
        return;
      }

      // Route to dashboard
      router.push("/dashboard");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-96"
      >
        <h1 className="text-2xl font-bold mb-4">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-3 rounded bg-gray-700 border border-gray-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded bg-gray-700 border border-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 rounded p-3 font-semibold"
        >
          {loading ? "Logging in…" : "Login"}
        </button>

        <p className="text-sm text-gray-400 mt-4">
          Don’t have an account? <a href="/register" className="text-blue-400">Register</a>
        </p>
      </form>
    </div>
  );
}
