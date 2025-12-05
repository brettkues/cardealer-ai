"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setStatus("A password reset link has been sent to your email.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setStatus("Error: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center p-8">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your account email"
            className="bg-gray-700 border border-gray-600 text-white p-3 rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        {status && (
          <p className="text-center mt-4 text-gray-300 whitespace-pre-wrap">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
