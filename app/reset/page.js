"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/firebase";
import { useRouter } from "next/navigation";

export default function ResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const sendReset = async () => {
    setErr("");
    setMsg("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent! Check your inbox.");
    } catch (error) {
      setErr(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md shadow-xl border border-gray-700">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          Reset Password
        </h1>

        {err && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 text-center">
            {err}
          </div>
        )}

        {msg && (
          <div className="bg-green-600 text-white p-3 rounded mb-4 text-center">
            {msg}
          </div>
        )}

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-6 bg-gray-700 text-white rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Reset Button */}
        <button
          onClick={sendReset}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg mb-4"
        >
          {loading ? "Sending..." : "Send Reset Email"}
        </button>

        <div className="text-center mt-4 text-gray-400">
          <p
            className="underline cursor-pointer"
            onClick={() => router.push("/login")}
          >
            Return to login
          </p>
        </div>
      </div>
    </div>
  );
}
