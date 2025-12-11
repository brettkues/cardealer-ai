"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const router = useRouter();

  async function login() {
    setErr("");

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      document.cookie = `email=${email}; path=/;`;
      router.push("/dashboard");
    } catch (e) {
      setErr("Invalid login.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Login</h1>

      <input
        className="w-full p-3 border rounded mb-3"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="w-full p-3 border rounded mb-3"
        placeholder="Password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />

      {err && <p className="text-red-600 mb-3">{err}</p>}

      <button
        onClick={login}
        className="w-full bg-blue-600 text-white p-3 rounded"
      >
        Login
      </button>
    </div>
  );
}
