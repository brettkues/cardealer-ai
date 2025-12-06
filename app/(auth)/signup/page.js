"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { db } from "../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function registerUser(uid, email) {
    await setDoc(doc(db, "users", uid), {
      email,
      role: "user", // default role
      createdAt: Date.now(),
    });
  }

  async function handleSignup() {
    setErrorMsg("");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Save user to Firestore
      await registerUser(userCred.user.uid, email);

      const token = await userCred.user.getIdToken();

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      router.push("/dashboard");
    } catch (err) {
      setErrorMsg("Unable to create account.");
    }
  }

  async function handleGoogleSignup() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Check if user exists in Firestore
      const uid = result.user.uid;

      await registerUser(uid, result.user.email);

      const token = await result.user.getIdToken();

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      router.push("/dashboard");
    } catch (err) {
      setErrorMsg("Google sign-up failed.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-center">Create Account</h1>

      <div className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && (
          <p className="text-red-600 text-sm text-center">{errorMsg}</p>
        )}

        <button
          onClick={handleSignup}
          className="w-full bg-green-600 text-white py-3 rounded hover:bg-green-700 transition"
        >
          Create Account
        </button>

        <button
          onClick={handleGoogleSignup}
          className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 transition"
        >
          Sign Up with Google
        </button>

        <div className="text-center mt-4">
          <a href="/login" className="text-blue-600 underline block">
            Already have an account?
          </a>
        </div>
      </div>
    </div>
  );
}
