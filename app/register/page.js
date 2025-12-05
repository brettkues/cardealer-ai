"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc
} from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) initializeApp(firebaseConfig);

const auth = getAuth();
const db = getFirestore();

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const uid = result.user.uid;

      // Create Firestore profile
      await setDoc(doc(db, "users", uid), {
        email,
        subscribed: false,
        createdAt: Date.now(),
      });

      // Get ID token for server session
      const token = await result.user.getIdToken();

      // Store server session cookie
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        alert("Failed to start session.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center">
      <form
        onSubmit={handleRegister}
        className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-96"
      >
        <h1 className="text-2xl font-bold mb-4">Create an Account</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-3 rounded bg-gray-700 border border-gray-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded bg-gray-700 border border-gray-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 rounded p-3 font-semibold"
        >
          {loading ? "Creating…" : "Register"}
        </button>

        <p className="text-sm text-gray-400 mt-4">
          Already have an account? <a href="/login" className="text-blue-400">Login</a>
        </p>
      </form>
    </div>
  );
}
