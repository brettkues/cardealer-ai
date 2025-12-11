"use client";

import { useState } from "react";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!msg) return;

    const newChat = [...chat, { role: "user", content: msg }];
    setChat(newChat);
    setMsg("");
    setLoading(true);

    const res = await fetch("/api/f-i-assistant", {
      method: "POST",
      body: JSON.stringify({ messages: newChat })
    });

    const data = await res.json();

    setChat([...newChat, { role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  async function analyzePdf() {
    if (!pdf) return;

    setLoading(true);

    const form = new FormData();
    form.append("file", pdf);

    const res = await fetch("/api/f-i-assistant", {
      method: "POST",
      body: form
    });

    const data = await res.json();

    setChat((prev) => [
      ...prev,
      { role: "assistant", content: data.analysis }
    ]);

    setLoading(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">F&I Assistant</h1>

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

        <div className="space-y-2 mt-4">
          <p className="font-semibold">Upload Deal Jacket / Contract (PDF)</p>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] || null)}
          />
          <button
            onClick={analyzePdf}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            Analyze PDF
          </button>
        </div>

      </div>
    </div>
  );
}
