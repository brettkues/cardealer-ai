"use client";

import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithRedirect,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    console.log("Google redirect started (signup)");
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.error("Google signup error:", err);
      setError("Google signup failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Sign Up</h1>

      <input
        type="email"
        className="w-full p-3 border rounded mb-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="w-full p-3 border rounded mb-3"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <button
        onClick={handleSignup}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition mb-4"
      >
        Create Account
      </button>

      <button
        onClick={handleGoogleSignup}
        className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 transition mb-4"
      >
        Sign Up with Google
      </button>

      <div className="mt-4 text-center">
        <Link href="/auth/login" className="text-blue-600 underline mr-4">
          Login
        </Link>
      </div>
    </div>
  );
}
