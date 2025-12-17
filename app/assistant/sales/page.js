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

    const text = await res.text();

    console.log("RAW RESPONSE:", text);

    try {
      const data = JSON.parse(text);
      setChat([...newChat, { role: "assistant", content: data.reply || data.error }]);
    } catch {
      setChat([...newChat, { role: "assistant", content: text }]);
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sales Assistant</h1>

      <div className="space-y-4">
        <div className="border rounded p-4 h-96 overflow-auto bg-white">
          {chat.map((m, i) => (
            <div key={i} className="mb-3">
              <b>{m.role === "user" ? "You" : "AI"}:</b> {m.content}
            </div>
          ))}
          {loading && <div>AI is typing...</div>}
        </div>

        <textarea
          className="w-full p-3 border rounded"
          placeholder="Ask something… (Enter to send)"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
      </div>
    </div>
  );
}
