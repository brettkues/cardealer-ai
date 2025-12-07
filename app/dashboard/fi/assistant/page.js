"use client";

import { useState } from "react";

export default function FIAssistantPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const askFIAI = async () => {
    if (!input.trim()) return;

    setResponse("Processing...");

    const res = await fetch("/api/fi/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const data = await res.json();
    setResponse(data.response || "No response returned.");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">F&I Assistant</h1>

      <div className="space-y-4 max-w-2xl">
        <textarea
          className="w-full p-3 border rounded"
          rows={4}
          placeholder="Ask anything F&I–related..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
