"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const signup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, pw);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Signup failed.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign Up</h1>

      <input
        type="email"
        placeholder="Email"
        className="border p-3 w-full mb-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-3 w-full mb-3"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      <button
        onClick={signup}
        className="bg-blue-600 text-white py-2 w-full rounded"
      >
        Create Account
      </button>

      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
}
