"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase once
if (!getApps().length) initializeApp(firebaseConfig);
const auth = getAuth();

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      // Firebase sign-in
      const creds = await signInWithEmailAndPassword(auth, email, password);
      const uid = creds.user.uid;

      // Set HTTP-only cookie on backend
      const res = await fetch("/api/session/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      if (!res.ok) {
        throw new Error("Failed to create session.");
      }

      // Redirect to dashboard
      router.push("/dashboard");

    } catch (err) {
      setError("Invalid email or password.");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", width: 300 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginTop: 10 }}
        />

        <button type="submit" style={{ marginTop: 20 }}>
          Login
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      </form>

      <p style={{ marginTop: 20 }}>
        <a href="/register">Create an account</a>
      </p>

      <p>
        <a href="/reset">Forgot password?</a>
      </p>
    </div>
  );
}
