"use client";

import { useState, useEffect } from "react";

export default function SalesAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replying, setReplying] = useState(false);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState("");

  // Load user's websites (already stored via your /social API)
  useEffect(() => {
    async function loadWebsites() {
      const res = await fetch("/social/get-websites");
      const data = await res.json();
      if (data?.websites) {
        setWebsites(data.websites);
        if (data.websites.length > 0) {
          setSelectedWebsite(data.websites[0].url);
        }
      }
    }
    loadWebsites();
  }, []);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setReplying(true);

    const res = await fetch("/api/sales-assistant", {
      method: "POST",
      body: JSON.stringify({
        messages: [...messages, newMessage],
        website: selectedWebsite,
      }),
    });

    const data = await res.json();
    const reply = data?.reply || "No response.";

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setReplying(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">Sales Assistant</h1>

      {/* Website selector */}
      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium">Website</label>
        <select
          value={selectedWebsite}
          onChange={(e) => setSelectedWebsite(e.target.value)}
          className="border rounded p-2 w-full"
        >
          {websites.map((w) => (
            <option key={w.id} value={w.url}>
              {w.url}
            </option>
          ))}
        </select>
      </div>

      {/* Chat window */}
      <div className="border rounded h-80 p-3 overflow-y-auto bg-white mb-4">
        {messages.map((m, i) => (
          <div key={i} className="mb-3">
            <strong>{m.role === "user" ? "You" : "Assistant"}:</strong>
            <p>{m.content}</p>
          </div>
        ))}

        {replying && <p className="text-gray-500">Assistant is typing…</p>}
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded p-2"
          placeholder="Ask a sales question..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
