// app/assistant/fi/page.js

"use client";

import { useEffect, useState } from "react";
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

    // NEWEST AT TOP
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

      if (!res.ok) throw new Error("Chat request failed");

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
    <div className="h-screen flex flex-col">
      {/* HEADER / DIRECTIONS */}
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold mb-3">F&I Assistant</h1>

        {/* TWO COLUMN INSTRUCTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          {/* LEFT COLUMN */}
          <div>
            <h2 className="font-semibold mb-2">Guided Deal Mode</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                Type <b>start a deal</b> to begin a guided F&amp;I workflow
              </li>
              <li>
                Step 1 will ask for deal type (<b>cash</b>, <b>finance</b>,{" "}
                <b>lease</b>)
              </li>
              <li>
                After each step, type <b>next</b> when complete
              </li>
              <li>
                Ask questions anytime — steps will <b>not</b> advance
              </li>
              <li>
                You may type <b>back</b> to review the previous step
              </li>
            </ul>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <h2 className="font-semibold mb-2">Training & Brain Management</h2>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                Managers/Admins can train using:
                <br />
                <b>ADD TO BRAIN:</b> followed by formatted instructions
              </li>
              <li>
                You may ask the assistant to <b>write training for you</b>, e.g.:
                <br />
                <i>
                  “Write training for F&amp;I Step 3 about entering a cash deal
                  in DMS”
                </i>
              </li>
              <li>
                The assistant will return copy-ready training text
              </li>
              <li>
                Paste it back using <b>ADD TO BRAIN:</b> to store it
              </li>
              <li>
                “Remember this” saves <b>personal notes only</b>
              </li>
            </ul>
          </div>
        </div>

        {/* INPUT */}
        <textarea
          className="w-full p-3 border rounded mt-4"
          placeholder="Ask a question, write training, ADD TO BRAIN, or start a deal…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
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
