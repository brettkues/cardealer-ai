"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseClient";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsub();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError("Invalid login.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-3xl font-semibold mb-4">
        {mode === "signin" ? "Login" : "Create Account"}
      </h1>

      <form onSubmit={handleSubmit}>
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
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded mb-4"
        >
          {mode === "signin" ? "Login" : "Sign Up"}
        </button>
      </form>

      <button
        className="text-blue-600 underline"
        onClick={() =>
          setMode(mode === "signin" ? "signup" : "signin")
        }
      >
        {mode === "signin"
          ? "Need an account?"
          : "Already have an account?"}
      </button>
    </div>
  );
}
