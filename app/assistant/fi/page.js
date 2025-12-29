"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const role = "manager"; // sales | manager | admin

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };

    // newest on top (Sales-style)
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

  function insertTrainingTemplate() {
    setMsg(
`TRAINING TEMPLATE (fill this in, then send):

F&I STEP #: 
Title:
Applies To: (cash / finance / lease / all)
System: (DealerTrack DMS, MenuSys, DMV, etc.)

Objective:
Explain what this step accomplishes.

Exact Steps:
- Click / Action
- Click / Action
- Verification step

Warnings / Critical Notes:
- What must never be missed
- Common mistakes

Completion Check:
How the user knows this step is complete.
`
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold mb-3">F&I Assistant</h1>

        {/* TWO COLUMN HELP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          {/* LEFT */}
          <div>
            <h2 className="font-semibold mb-2">Guided Deal Mode</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Type <b>start a deal</b> to begin</li>
              <li>Step 1 sets deal type (cash / finance / lease)</li>
              <li>Type <b>next</b> when a step is complete</li>
              <li>Type <b>back</b> to return to the previous step</li>
              <li>
                You may ask questions about <b>any step</b> at any time
                <br />
                <span className="text-xs text-gray-500">
                  (Example: “How do I do Step 3 tax selection?”)
                </span>
              </li>
            </ul>
          </div>

          {/* RIGHT */}
          <div>
            <h2 className="font-semibold mb-2">Training the Brain</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Use <b>ADD TO BRAIN:</b> to store dealership training</li>
              <li>The assistant can write training for you</li>
              <li>Use the template button below to stay consistent</li>
              <li>Paste finalized text back with <b>ADD TO BRAIN:</b></li>
            </ul>

            <button
              onClick={insertTrainingTemplate}
              className="mt-3 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Insert Training Template
            </button>
          </div>
        </div>

        {/* INPUT */}
        <textarea
          className="w-full p-3 border rounded mt-4"
          placeholder="Ask a question, start a deal, or add training…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={loading}
        />
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {loading && (
          <div className="text-sm text-gray-500 mb-4">AI is typing…</div>
        )}

        {chat.map((m, i) => (
          <div key={i} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "F&I Assistant"}
            </div>

            <div className="whitespace-pre-wrap">{m.content}</div>

            {m.source && (
              <div className="text-xs text-gray-500 mt-1">{m.source}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
