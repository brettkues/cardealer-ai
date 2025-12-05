"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIMarketingGenerator() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState(null);

  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------------------------
  // LOGIN + SUBSCRIPTION VALIDATION
  // -------------------------------------------
  useEffect(() => {
    async function verify() {
      // 1. Get session
      const sessionRes = await fetch("/api/session/me");
      const session = await sessionRes.json();

      if (!session.uid) {
        router.push("/login");
        return;
      }

      // 2. Subscription check
      const subRes = await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ uid: session.uid }),
      });

      const sub = await subRes.json();

      if (!sub.active) {
        router.push("/subscribe");
        return;
      }

      setUid(session.uid);
      setChecking(false);
    }

    verify();
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Loading…
      </div>
    );
  }

  // -------------------------------------------
  // SEND PROMPT TO /api/chat
  // -------------------------------------------
  async function sendPrompt() {
    if (!input.trim()) return alert("Enter text first.");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setReply(data.reply);
    } catch (err) {
      alert("Error: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-8">AI Marketing Generator</h1>

      <div className="bg-gray-800 p-6 rounded-xl max-w-2xl">
        <label className="font-semibold">Describe the vehicle, deal, or ad idea:</label>

        <textarea
          className="w-full bg-gray-700 text-white p-3 rounded mt-2 h-40"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={sendPrompt}
          disabled={loading}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {loading ? "Generating…" : "Generate Text"}
        </button>
      </div>

      {reply && (
        <div className="mt-10 bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-3xl">
          <h2 className="text-xl font-semibold mb-3">Generated Marketing Copy</h2>

          <pre className="whitespace-pre-wrap text-gray-100">{reply}</pre>
        </div>
      )}
    </div>
  );
}
