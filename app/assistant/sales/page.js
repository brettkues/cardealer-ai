"use client";

import { useState } from "react";

export default function SalesAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage({ allowSearch = false } = {}) {
    if (!msg || loading) return;

    const userMessage = { role: "user", content: msg };

    const newChat = [userMessage, ...chat];
    setChat(newChat);
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: newChat,
          role: "manager", // adjust if needed
          allowSearch,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response received.",
        source: data.source || null,
        needsSearchApproval: data.needsSearchApproval,
        canSave: data.canSave,
        savePayload: data.savePayload,
      };

      setChat([aiMessage, ...newChat]);
    } catch {
      setChat([
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
        ...newChat,
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function saveToBrain(content) {
    await fetch("/api/brain/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        role: "manager", // admin / manager only
      }),
    });

    alert("Saved to brain.");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* INPUT AREA */}
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">Sales Assistant</h1>
        <textarea
          className="w-full p-3 border rounded mt-3"
          placeholder="Ask a sales question… (Enter to send)"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m, i) => (
          <div key={i} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "AI"}
            </div>

            <div className="whitespace-pre-wrap">{m.content}</div>

            {m.source && (
              <div className="text-xs text-gray-500 mt-1">
                {m.source}
              </div>
            )}

            {m.needsSearchApproval && (
              <button
                className="mt-2 text-blue-600 underline"
                onClick={() => sendMessage({ allowSearch: true })}
              >
                Search for answer
              </button>
            )}

            {m.canSave && (
              <button
                className="mt-2 ml-4 text-green-600 underline"
                onClick={() => saveToBrain(m.savePayload)}
              >
                Save to brain
              </button>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-500">AI is typing…</div>
        )}
      </div>
    </div>
  );
}
