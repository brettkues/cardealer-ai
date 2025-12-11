"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function reset() {
    setMsg("");
    setErr("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent.");
    } catch (e) {
      setErr("Unable to send reset email.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Reset Password</h1>

      <input
        type="email"
        className="w-full p-3 border rounded mb-3"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {msg && <p className="text-green-600 mb-3">{msg}</p>}
      {err && <p className="text-red-600 mb-3">{err}</p>}

      <button
        onClick={reset}
        className="w-full bg-blue-600 text-white p-3 rounded"
      >
        Send Reset Email
      </button>
    </div>
  );
}
