"use client";

import { useState } from "react";

export default function FIAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [replying, setReplying] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setReplying(true);

    const res = await fetch("/api/f-i-assistant", {
      method: "POST",
      body: JSON.stringify({
        messages: [...messages, newMessage],
      }),
    });

    const data = await res.json();
    const reply = data?.reply || "No response.";

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setReplying(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">F&I Assistant</h1>

      {/* Chat history */}
      <div className="border rounded h-80 p-3 overflow-y-auto bg-white mb-4">
        {messages.map((m, i) => (
          <div key={i} className="mb-3">
            <strong>{m.role === "user" ? "You" : "Assistant"}:</strong>
            <p>{m.content}</p>
          </div>
        ))}

        {replying && <p className="text-gray-500">Assistant is typing…</p>}
      </div>

      {/* Input and send button */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded p-2"
          placeholder="Ask an F&I question..."
        />
        <button
          onClick={sendMessage}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
