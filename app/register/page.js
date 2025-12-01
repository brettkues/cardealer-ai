"use client";

import { useState } from "react";
import { auth, db } from "@/app/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = userCred.user.uid;

      // Create Firestore profile
      await setDoc(doc(db, "users", uid), {
        email,
        role: "dealer",               // default role
        subscriptionActive: false,    // must subscribe
        subscriptionSource: "none",   // until paid or promo
        createdAt: serverTimestamp(),
      });

      // Send user to Subscribe page
      router.push("/subscribe");
    } catch (err) {
      setError(err.message || "Registration failed.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md border border-gray-700">

        <h1 className="text-3xl font-bold mb-6">Create Your Account</h1>

        {/* Email */}
        <label className="block mb-2">Email</label>
        <input
          type="email"
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 mb-4"
          placeholder="you@dealership.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Password */}
        <label className="block mb-2">Password</label>
        <input
          type="password"
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 mb-4"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Confirm Password */}
        <label className="block mb-2">Confirm Password</label>
        <input
          type="password"
          className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 mb-4"
          placeholder="********"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Error */}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mt-2 mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg text-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        {/* Login link */}
        <div className="mt-6 text-sm text-blue-400 text-center">
          <button onClick={() => router.push("/login")}>
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}
