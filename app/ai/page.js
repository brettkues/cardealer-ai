"use client";

import { useState } from "react";

export default function AIPage() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendPrompt() {
    if (!prompt.trim()) return;

    setLoading(true);
    setReply("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (data.error) {
      setReply("Error: " + data.error);
    } else {
      setReply(data.reply);
    }

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>AI Assistant</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something…"
        style={{
          width: "100%",
          height: 120,
          padding: 10,
          marginTop: 20,
          fontSize: 16,
        }}
      />

      <button
        onClick={sendPrompt}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "10px 20px",
          fontSize: 16,
        }}
      >
        {loading ? "Thinking…" : "Send"}
      </button>

      {reply && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            background: "#f0f0f0",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {reply}
        </div>
      )}
    </div>
  );
}
