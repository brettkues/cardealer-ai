"use client";

import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const finishLogin = async () => {
    // Wait for Firebase to hydrate the ID token
    const user = auth.currentUser;
    if (user) {
      await user.getIdToken(true);
      router.push("/dashboard");
    } else {
      setError("Login failed to initialize session.");
    }
  };

  const handleLogin = async () => {
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await finishLogin();
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // VERY IMPORTANT: hydrate token BEFORE redirect
      await result.user.getIdToken(true);

      router.push("/dashboard");
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>

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
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition mb-4"
      >
        Login
      </button>

      <button
        onClick={handleGoogleLogin}
        className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 transition mb-4"
      >
        Login with Google
      </button>

      <div className="mt-4 text-center">
        <Link href="/auth/signup" className="text-blue-600 underline mr-4">
          Sign Up
        </Link>
        <Link href="/auth/reset" className="text-blue-600 underline">
          Reset Password
        </Link>
      </div>
    </div>
  );
}
