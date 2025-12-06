"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function handleReset() {
    setStatus("");

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("A password reset link has been sent to your email.");
    } catch (err) {
      setStatus("Unable to send reset email.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-center">Reset Password</h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
        >
          Send Reset Link
        </button>

        {status && (
          <p className="text-center text-sm mt-2 text-gray-700">{status}</p>
        )}

        <div className="text-center mt-4">
          <a href="/login" className="text-blue-600 underline block">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
