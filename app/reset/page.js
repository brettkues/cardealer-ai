"use client";

import { useState } from "react";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const res = await fetch("/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Reset request failed");
      return;
    }

    setMessage("If an account exists, a reset link has been sent.");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Reset Password</h1>

      <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", width: 300 }}>
        <input
          type="email"
          placeholder="Enter your account email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" style={{ marginTop: 20 }}>
          Send Reset Link
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
        {message && <p style={{ color: "green", marginTop: 10 }}>{message}</p>}
      </form>

      <p style={{ marginTop: 20 }}>
        <a href="/login">Back to Login</a>
      </p>
    </div>
  );
}
