"use client";

import { useState } from "react";

export default function ServiceAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const role = "manager"; // service | manager | admin

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };
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
          role,
          domain: "service"
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response received.",
        source: data.source || null,
        _id: `${Date.now()}-${Math.random()}`,
      };

      setChat([aiMessage, ...newChat]);
    } catch {
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
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <h1 className="text-xl font-bold">Service Assistant</h1>
      </div>

      {/* INPUT */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-2">
          <textarea
            className="flex-1 p-3 border rounded"
            placeholder="Ask a service question… (Enter to send)"
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

      {/* CHAT */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m, i) => (
          <div key={m._id || i} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "Service Assistant"}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.source && (
              <div className="text-xs text-gray-500 mt-1">{m.source}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-500">Service Assistant is typing…</div>
        )}
      </div>
    </div>
  );
}
