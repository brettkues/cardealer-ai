"use client";

import { useState } from "react";

export default function FIAssistant() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  async function sendMessage() {
    if (!input) return;

    const res = await fetch("/api/assistant/fi", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();
    setResponse(data.reply || "No response returned.");
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">F&I Assistant</h1>

      <textarea
        className="w-full p-3 border rounded mb-3 h-32"
        placeholder="Ask the F&I assistant..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={sendMessage}
        className="w-full bg-green-600 text-white p-3 rounded mb-6"
      >
        Send
      </button>

      {response && (
        <div className="bg-gray-100 p-4 rounded shadow">
          {response}
        </div>
      )}
    </div>
  );
}
