"use client";

import { useState } from "react";
import { auth, googleProvider } from "../../../lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function loginUser() {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    }
  }

  async function loginGoogle() {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>

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

      <button
        onClick={loginUser}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
      >
        Log In
      </button>

      <button
        onClick={loginGoogle}
        className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 mt-3"
      >
        Sign in with Google
      </button>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
