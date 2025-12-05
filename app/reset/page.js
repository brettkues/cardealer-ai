"use client";

import { useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendReset = async () => {
    if (!email) {
      alert("Enter your email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/set", {
        method: "POST",
        body: JSON.stringify({
          action: "reset",
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to send reset email");
      } else {
        alert("Password reset email sent.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <div className="p-10 bg-gray-800 rounded-2xl border border-gray-700 w-96">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded-lg bg-gray-700 mb-6"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={sendReset}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {loading ? "Sending…" : "Send Reset Email"}
        </button>
      </div>
    </div>
  );
}
