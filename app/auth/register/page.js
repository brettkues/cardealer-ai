"use client";

import { useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const u = userCred.user;

      await setDoc(doc(db, "users", u.uid), {
        email: u.email,
        role: "user",
      });

      document.cookie = `loggedIn=true; path=/;`;
      document.cookie = `email=${u.email}; path=/;`;
      document.cookie = `role=user; path=/;`;

      router.push("/dashboard");
    } catch (err) {
      setError("Registration failed.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Create Account</h1>

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
        onClick={handleRegister}
        className="w-full bg-green-600 text-white p-3 rounded mb-4"
      >
        Register
      </button>

      <div className="text-sm">
        <a href="/auth/login" className="underline text-blue-700">Already have an account?</a>
      </div>
    </div>
  );
}
