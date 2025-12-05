"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SocialCollagePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState(null);

  const [description, setDescription] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function verify() {
      // 1. Get session
      const sessionRes = await fetch("/api/session/me");
      const session = await sessionRes.json();

      if (!session.uid) {
        router.push("/login");
        return;
      }

      // 2. Check subscription
      const subRes = await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ uid: session.uid })
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

  async function generateCollage() {
    if (!description.trim()) return alert("Enter a description first.");
    setLoading(true);

    try {
      const res = await fetch("/api/collage", {
        method: "POST",
        body: JSON.stringify({
          uid,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setResultUrl(data.url);
    } catch (err) {
      alert("Error generating collage: " + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">Facebook Collage Generator</h1>

      <div className="bg-gray-800 p-6 rounded-xl max-w-xl">
        <label className="font-semibold">Short description</label>
        <textarea
          className="w-full bg-gray-700 text-white p-3 rounded mt-2 h-32"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={generateCollage}
          disabled={loading}
          className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          {loading ? "Generating…" : "Generate Collage"}
        </button>
      </div>

      {resultUrl && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-3">Generated Image</h2>
          <img
            src={resultUrl}
            alt="Generated collage"
            className="rounded-xl shadow-xl border border-gray-700 max-w-xl"
          />
        </div>
      )}
    </div>
  );
}
