"use client";

import { useState } from "react";

export default function SalesAssistant() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function askSalesAI() {
    if (!input.trim()) return;

    setLoading(true);
    setOutput("");

    const res = await fetch("/api/assistant/sales", {
      method: "POST",
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();
    setOutput(data.response || "No response returned.");

    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Sales Assistant</h1>

      <textarea
        className="w-full p-3 border rounded mb-3 h-32"
        placeholder="Ask anything related to selling cars, sales steps, follow-up, objections, closing..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        onClick={askSalesAI}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded mb-4"
      >
        {loading ? "Thinking..." : "Ask"}
      </button>

      {output && (
        <div className="p-4 border rounded bg-gray-50 whitespace-pre-wrap">
          {output}
        </div>
      )}
    </div>
  );
}
