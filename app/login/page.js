"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";

// RELATIVE IMPORT — REQUIRED FOR VERCEL
import { auth } from "../firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-96">

        <h1 className="text-3xl font-bold mb-6 text-center">Dealer Login</h1>

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
          onClick={handleLogin}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          Sign In
        </button>

        <p
          className="text-blue-400 text-center mt-4 cursor-pointer"
          onClick={() => router.push("/reset")}
        >
          Forgot Password?
        </p>

        <p
          className="text-blue-400 text-center mt-2 cursor-pointer"
          onClick={() => router.push("/register")}
        >
          Create Account
        </p>
      </div>
    </div>
  );
}
