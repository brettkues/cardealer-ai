"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleRegister = async () => {
    setError("");

    try {
      // Create Auth user
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = userCred.user.uid;

      // Create Firestore user record
      await setDoc(doc(db, "users", uid), {
        email: email,
        role: "user",
      });

      // Set cookies for middleware
      document.cookie = `loggedIn=true; path=/;`;
      document.cookie = `role=user; path=/;`;

      router.push("/dashboard");
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setError(err.message || "Unable to register.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-2xl mb-4">Create Account</h1>

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
        className="w-full bg-green-600 text-white p-3 rounded"
      >
        Register
      </button>

      <button
        onClick={() => router.push("/auth/login")}
        className="w-full mt-3 underline text-sm"
      >
        Back to login
      </button>
    </div>
  );
}

