"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../lib/firebase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent.");
    } catch (err) {
      setMessage("Error sending reset email.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-black">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">Reset Password</h1>

        {message && <p className="text-blue-600 text-center mb-4">{message}</p>}

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition">
            Send Reset Link
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/login" className="text-blue-600 hover:underline">Back to Login</a>
        </div>
      </div>
    </div>
  );
}
