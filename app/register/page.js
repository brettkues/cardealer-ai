"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/app/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, move to dashboard or subscribe
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          if (data.role === "admin" || data.subscriptionActive) {
            router.push("/dashboard");
          } else {
            router.push("/subscribe");
          }
        }
      }
    });

    return () => unsub();
  }, [router]);

  const registerEmailPassword = async () => {
    setErr("");
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Create Firestore record
      await setDoc(doc(db, "users", user.uid), {
        email,
        role: "user",
        subscriptionActive: false,
        subscriptionSource: null,
        trialEnds: null,
      });

      router.push("/subscribe");
    } catch (error) {
      setErr(error.message);
    }

    setLoading(false);
  };

  const registerGoogle = async () => {
    setErr("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const user = result.user;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      // Create Firestore record only if new user
      if (!snap.exists()) {
        await setDoc(ref, {
          email: user.email,
          role: "user",
          subscriptionActive: false,
          subscriptionSource: null,
          trialEnds: null,
        });
      }

      router.push("/subscribe");
    } catch (error) {
      setErr(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 p-10 rounded-2xl w-full max-w-md shadow-xl border border-gray-700">
        <h1 className="text-3xl font-bold text-white text-center mb-6">
          Create Your Account
        </h1>

        {err && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 text-center">
            {err}
          </div>
        )}

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 bg-gray-700 text-white rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 bg-gray-700 text-white rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Register Button */}
        <button
          onClick={registerEmailPassword}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg mb-4"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        {/* Google Signup */}
        <button
          onClick={registerGoogle}
          disabled={loading}
          className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg"
        >
          {loading ? "Please wait..." : "Sign Up with Google"}
        </button>

        <div className="text-center mt-6 text-gray-400">
          <p>
            Already have an account?{" "}
            <span
              className="underline cursor-pointer"
              onClick={() => router.push("/login")}
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
