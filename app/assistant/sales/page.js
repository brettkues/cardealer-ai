"use client";

import { useState } from "react";

export default function SalesAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!msg) return;

    const newChat = [...chat, { role: "user", content: msg }];
    setChat(newChat);
    setMsg("");
    setLoading(true);

    const res = await fetch("/api/sales-assistant", {
      method: "POST",
      body: JSON.stringify({ messages: newChat })
    });

    const data = await res.json();

    setChat([...newChat, { role: "assistant", content: data.reply }]);
    setLoading(false);
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

        <div className="flex gap-2">
          <input
            className="flex-1 p-3 border rounded"
            placeholder="Ask something..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="px-4 bg-blue-600 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
