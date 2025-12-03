"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSubscription } from "@/utils/checkSubscription";   // ← ALIAS FIXED
import { auth, db } from "@/app/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AIPage() {
  const router = useRouter();

  const [sub, setSub] = useState(null);
  const [userMessage, setUserMessage] = useState("");
  const [aiResponse, setAIResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------
  // ENFORCE LOGIN + SUBSCRIPTION
  // ---------------------------------------------------
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const active = await checkSubscription(user.uid);

      if (!active) {
        router.push("/subscribe");
        return;
      }

      setSub({
        loggedIn: true,
        active,
        uid: user.uid,
      });
    });

    return () => unsub();
  }, [router]);

  if (!sub) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking subscription…
      </div>
    );
  }

  // ---------------------------------------------------
  // SEND MESSAGE TO AI API
  // ---------------------------------------------------
  const sendMessage = async () => {
    if (!userMessage.trim()) return;
    setLoading(true);
    setAIResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: sub.uid,
          userMessage,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setAIResponse("Error: " + data.error);
      } else {
        setAIResponse(data.answer);
      }
    } catch (err) {
      setAIResponse("Request failed: " + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* HEADER */}
      <div className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dealer AI Assistant</h1>

        <button
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* BODY */}
      <div className="p-8 max-w-4xl mx-auto w-full">
        <textarea
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          className="w-full h-32 bg-gray-800 border border-gray-700 p-3 rounded-lg"
          placeholder="Ask the dealer AI anything…"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {loading ? "Thinking…" : "Send"}
        </button>

        {aiResponse && (
          <div className="mt-6 bg-gray-800 border border-gray-700 p-4 rounded-lg whitespace-pre-wrap">
            {aiResponse}
          </div>
        )}
      </div>
    </div>
  );
}
