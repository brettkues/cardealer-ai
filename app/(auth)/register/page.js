"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const register = async () => {
    try {
      setStatus("Creating account...");

      await createUserWithEmailAndPassword(auth, email, password);

      setStatus("Account created. You can now log in.");
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-20">
      <h1 className="text-3xl font-semibold mb-6">Register</h1>

      <input
        type="email"
        placeholder="Email"
        className="block w-full p-3 border rounded mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="block w-full p-3 border rounded mb-6"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={register}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
      >
        Create Account
      </button>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
