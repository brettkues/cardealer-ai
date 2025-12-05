"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GeneratorPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState(null);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------
  // VERIFY LOGIN + SUBSCRIPTION
  // ---------------------------------------------
  useEffect(() => {
    async function verify() {
      const res = await fetch("/api/session/me");
      const data = await res.json();

      if (!data.uid) {
        router.push("/login");
        return;
      }

      const subRes = await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ uid: data.uid }),
      });
      const sub = await subRes.json();

      if (!sub.active) {
        router.push("/subscribe");
        return;
      }

      setUid(data.uid);
      setChecking(false);
    }

    verify();
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking access…
      </div>
    );
  }

  // ---------------------------------------------
  // SEND PROMPT TO AI
  // ---------------------------------------------
  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt: input }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setReply(data.reply);
    } catch (err) {
      setReply("Error: " + err.message);
    }

    setLoading(false);
  };

  // ---------------------------------------------
  // UI
  // ---------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">AI Generator</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-40 p-4 bg-gray-800 border border-gray-700 rounded-lg"
        placeholder="Enter text to generate response…"
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg"
      >
        {loading ? "Generating…" : "Generate"}
      </button>

      {reply && (
        <div className="mt-6 bg-gray-800 p-5 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Response</h2>
          <p className="whitespace-pre-wrap">{reply}</p>
        </div>
      )}
    </div>
  );
}
