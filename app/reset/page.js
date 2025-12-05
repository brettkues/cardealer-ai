"use client";

import { useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) initializeApp(firebaseConfig);

const auth = getAuth();

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function handleReset(e) {
    e.preventDefault();
    setStatus("");

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("A password reset link has been sent to your email.");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <form
        onSubmit={handleReset}
        className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-96"
      >
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full mb-4 p-3 bg-gray-700 border border-gray-600 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded font-semibold"
        >
          Send Reset Email
        </button>

        {status && (
          <p className="text-sm text-gray-300 mt-4 whitespace-pre-line">{status}</p>
        )}

        <p className="text-sm text-gray-400 mt-4">
          <a href="/login" className="text-blue-400">Back to Login</a>
        </p>
      </form>
    </div>
  );
}
