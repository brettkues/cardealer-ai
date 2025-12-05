"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    // success → session created → redirect
    router.push("/dashboard");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Create Account</h1>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", width: 300 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginTop: 10 }}
        />

        <button type="submit" style={{ marginTop: 20 }}>
          Register
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      </form>

      <p style={{ marginTop: 20 }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
