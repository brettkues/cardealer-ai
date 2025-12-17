"use client";

import { useState } from "react";

export default function SalesAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!msg || loading) return;

    const newChat = [...chat, { role: "user", content: msg }];
    setChat(newChat);
    setMsg("");
    setLoading(true);

    const res = await fetch("/api/sales-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newChat })
    });

    const data = await res.json();

    setChat([...newChat, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Sales Assistant</h1>
        <textarea
          className="w-full p-3 border rounded mt-3"
          placeholder="Ask a sales question… (Enter to send)"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
        />
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m, i) => (
          <div key={i} className="mb-4">
            <b>{m.role === "user" ? "You" : "AI"}:</b>
            <div>{m.content}</div>
          </div>
        ))}
        {loading && <div>AI is typing…</div>}
      </div>
    </div>
  );
}
