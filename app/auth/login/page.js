"use client";

import { useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const u = userCred.user;

      const snap = await getDoc(doc(db, "users", u.uid));
      const role = snap.exists() ? snap.data().role : "user";

      document.cookie = `loggedIn=true; path=/;`;
      document.cookie = `email=${u.email}; path=/;`;
      document.cookie = `role=${role}; path=/;`;

      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Login</h1>

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
        className="w-full bg-blue-600 text-white p-3 rounded mb-4"
      >
        Login
      </button>

      <div className="text-sm">
        <a href="/auth/reset" className="underline text-blue-700">Forgot password?</a>
        <br />
        <a href="/auth/register" className="underline text-blue-700">Create account</a>
      </div>
    </div>
  );
}
