"use client";

import { useState } from "react";
import { auth } from "@/app/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    setSent(false);

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Unable to send reset email.");
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleReset();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md border border-gray-700">

        <h1 className="text-3xl font-bold mb-6">Reset Password</h1>

        <label className="block mb-2">Email</label>
        <input
          type="email"
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 mb-4"
          placeholder="you@dealership.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKey}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {sent && (
          <div className="bg-green-600 text-white p-3 rounded-lg mb-4 text-sm">
            Password reset email sent. Check your inbox.
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Reset Email"}
        </button>

        {/* Links */}
        <div className="mt-6 text-center text-sm text-blue-400">
          <button onClick={() => router.push("/login")}>Back to Login</button>
        </div>
      </div>
    </div>
  );
}
