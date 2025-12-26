// app/assistant/fi/page.js

"use client";

import { useRef, useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sessionIdRef = useRef(
    `fi-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const role = "manager";

  async function sendMessage() {
    if (!msg || loading) return;

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
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await res.json();

      setChat((c) => [
        {
          role: "assistant",
          content: data.answer || "No response.",
          source: data.source || null,
        },
        ...c,
      ]);
    } catch {
      setChat((c) => [
        { role: "assistant", content: "Something went wrong." },
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
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">F&I Assistant</h1>

        <textarea
          className="w-full p-3 border rounded mt-3"
          placeholder="Type 'start a deal' to begin…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m, i) => (
          <div key={i} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "AI"}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.source && (
              <div className="text-xs text-gray-500 mt-1">{m.source}</div>
            )}
          </div>
        ))}

        {loading && <div className="text-sm text-gray-500">AI is typing…</div>}
      </div>
    </div>
  );
}
