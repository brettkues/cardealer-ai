"use client";

import { useState } from "react";

export default function SalesAssistantPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const askSalesAI = async () => {
    if (!input.trim()) return;

    const res = await fetch("/api/sales/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const data = await res.json();
    setResponse(data.response || "");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Sales Assistant</h1>

      <div className="space-y-4 max-w-2xl">
        <textarea
          className="w-full p-3 border rounded"
          rows={4}
          placeholder="Ask anything sales-related..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          onClick={askSalesAI}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Ask
        </button>

        {response && (
          <div className="p-4 bg-white border rounded shadow whitespace-pre-wrap">
            {response}
          </div>
        )}
      </div>
    </div>
  );
}
