"use client";

import { useState } from "react";

export default function SalesAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!msg || loading) return;

    const userMessage = { role: "user", content: msg };

    // New messages go on top
    const newChat = [userMessage, ...chat];
    setChat(newChat);
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: newChat, // 👈 PASS CONTEXT
        }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response received.",
        source: data.source || null,
      };

      // AI reply goes directly under the user message
      setChat([aiMessage, ...newChat]);
    } catch (err) {
      setChat([
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
        ...newChat,
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
      {/* INPUT AREA */}
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">Sales Assistant</h1>
        <textarea
          className="w-full p-3 border rounded mt-3"
          placeholder="Ask a sales question… (Enter to send)"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m, i) => (
          <div key={i} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "AI"}
            </div>

            <div className="whitespace-pre-wrap">{m.content}</div>

            {m.source && (
              <div className="text-xs text-gray-500 mt-1">
                {m.source}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-500">AI is typing…</div>
        )}
      </div>
    </div>
  );
}
