"use client";

import { useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const router = useRouter();

  async function register() {
    setErr("");

    try {
      const creds = await createUserWithEmailAndPassword(auth, email, pass);

      await setDoc(doc(db, "users", creds.user.uid), {
        email,
        role: "user",
      });

      router.push("/dashboard");
    } catch (e) {
      setErr("Unable to register.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Register</h1>

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
        onClick={register}
        className="w-full bg-blue-600 text-white p-3 rounded"
      >
        Register
      </button>
    </div>
  );
}
