// app/assistant/fi/page.js

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

    // NEWEST ON TOP
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
      <div className="p-4 border-b bg-white space-y-2">
        <h1 className="text-2xl font-bold">F&I Assistant</h1>

        <div className="text-sm text-gray-700 space-y-1">
          <p>
            • Start a guided deal by typing <b>start a deal</b>
          </p>
          <p>
            • Complete each step, then type <b>next</b>
          </p>
          <p>
            • To go back one step, type <b>back</b>
          </p>
          <p>
            • Ask questions anytime (steps will not advance)
          </p>
          <p>
            • Managers/Admins can train the system using:
            <br />
            <b>ADD TO BRAIN: [instruction]</b>
          </p>
          <p>
            • “Remember this” saves personal notes only
          </p>
        </div>

        <textarea
          className="w-full p-3 border rounded mt-2"
          placeholder="Ask a question, ADD TO BRAIN:, or type start a deal…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
      </div>

      {/* CHAT (NEWEST FIRST) */}
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
