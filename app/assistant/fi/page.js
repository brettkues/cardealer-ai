"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const role = "manager";

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };

    setChat((c) => [userMessage, ...c]);
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          role,
          domain: "fi",
          userId: auth.currentUser?.uid || "fi-user",
          sessionId,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const data = await res.json();

      setChat((c) => [
        {
          role: "assistant",
          content: data.answer,
          source: data.source,
        },
        ...c,
      ]);
    } catch {
      setChat((c) => [
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
        ...c,
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* ===== TOP: 4 COLUMN INFO BAR ===== */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b">

        {/* COLUMN 1 – NAVIGATION */}
        <div>
          <h2 className="font-bold mb-2">Navigation</h2>
          <ul className="text-sm space-y-1">
            <li>• <b>start a deal</b></li>
            <li>• Step 1 auto-advances</li>
            <li>• <b>next</b> = forward</li>
            <li>• <b>back</b> = previous step</li>
            <li>• Ask questions anytime</li>
          </ul>
        </div>

        {/* COLUMN 2 – TRAINING */}
        <div>
          <h2 className="font-bold mb-2">Training</h2>
          <p className="text-sm mb-2">
            Managers/Admins only:
          </p>
          <pre className="bg-gray-100 p-2 rounded text-xs">
ADD TO BRAIN:
F&I STEP X – [Title]

• One action per line
• Exact clicks / fields
• This becomes policy
          </pre>
          <p className="text-xs text-gray-600 mt-2">
            “Remember this” = personal notes only
          </p>
        </div>

        {/* COLUMN 3 – F&I STEPS (1–5) */}
        <div>
          <h2 className="font-bold mb-2">F&I Steps</h2>
          <ol className="text-sm list-decimal ml-4 space-y-1">
            <li>Identify deal type</li>
            <li>Enter deal into DMS</li>
            <li>Approvals & stips</li>
            <li>Build F&I menu</li>
            <li>Build contract</li>
          </ol>
        </div>

        {/* COLUMN 4 – F&I STEPS (6–11) */}
        <div>
          <h2 className="font-bold mb-2">&nbsp;</h2>
          <ol
            start={6}
            className="text-sm list-decimal ml-4 space-y-1"
          >
            <li>Compliance documents</li>
            <li>Add products / rebuild</li>
            <li>Signatures</li>
            <li>DMV</li>
            <li>Funding</li>
            <li>Deal recap & cap</li>
          </ol>
        </div>
      </div>

      {/* ===== BOTTOM: CHAT AREA ===== */}
      <div className="flex-1 flex flex-col">

        {/* CHAT HISTORY */}
        <div className="flex-1 overflow-auto p-4">
          {chat.map((m, i) => (
            <div key={i} className="mb-4">
              <div className="font-semibold">
                {m.role === "user" ? "You" : "F&I Assistant"}
              </div>
              <div className="whitespace-pre-wrap">
                {m.content}
              </div>
              {m.source && (
                <div className="text-xs text-gray-500 mt-1">
                  {m.source}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="border-t bg-white p-4 flex gap-2">
          <textarea
            className="flex-1 p-3 border rounded"
            placeholder="Ask a question, ADD TO BRAIN:, or start a deal…"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
