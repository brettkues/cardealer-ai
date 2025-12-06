"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleEmailLogin(e) {
    e.preventDefault();
    setStatus("Signing in…");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setStatus("Login failed. Check email and password.");
    }
  }

  async function handleGoogleLogin() {
    setStatus("Signing in with Google…");

    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const token = await userCred.user.getIdToken();

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      window.location.href = "/dashboard";
    } catch (err) {
      setStatus("Google sign-in failed.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Sign In</h1>

      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          className="w-full p-3 border rounded mb-3"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 border rounded mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
        >
          Sign In
        </button>
      </form>

      <button
        onClick={handleGoogleLogin}
        className="w-full bg-red-600 text-white py-3 rounded mt-4 hover:bg-red-700 transition"
      >
        Continue with Google
      </button>

      {status && <p className="mt-4 text-gray-700">{status}</p>}

      {/* Links */}
      <div className="text-center mt-4">
        <a href="/signup" className="text-blue-600 underline">
          Create an account
        </a>
        <br />
        <a href="/reset" className="text-blue-600 underline">
          Forgot password?
        </a>
      </div>
    </div>
  );
}
