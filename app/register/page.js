"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

// FIXED — RELATIVE IMPORTS ONLY
import { auth, db } from "../firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        subscriptionActive: false,
        role: "user",
        createdAt: new Date(),
      });

      router.push("/subscribe");
    } catch (err) {
      setError(err.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-96">

        <h1 className="text-3xl font-bold text-center mb-6">
          Create Your Account
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="bg-red-700 p-2 rounded-lg text-center mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          Create Account
        </button>

        <p
          className="text-blue-400 text-center mt-4 cursor-pointer"
          onClick={() => router.push("/login")}
        >
          Already have an account? Sign in
        </p>
      </div>
    </div>
  );
}
