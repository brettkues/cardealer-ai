"use client";

import { useState } from "react";
import { auth } from "../../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function register() {
    setError("");
    setMessage("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created. You may now log in.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Create an Account</h1>

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

      <button
        onClick={register}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
      >
        Register
      </button>

      {error && <p className="text-red-600 mt-3">{error}</p>}
      {message && <p className="text-green-600 mt-3">{message}</p>}
    </div>
  );
}
