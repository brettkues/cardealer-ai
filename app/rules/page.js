"use client";

import { useState } from "react";

export default function SalesAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  const role = "manager"; // sales | manager | admin

  async function sendMessage() {
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
          role,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response received.",
        source: data.source || null,
        source_files: data.source_files || [],
        _id: `${Date.now()}-${Math.random()}`,
      };

      setChat([aiMessage, ...newChat]);
    } catch {
      setChat([
        { role: "assistant", content: "Something went wrong. Please try again." },
        ...newChat,
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* HEADER + RULES */}
      <div className="p-4 border-b bg-white space-y-3">
        <h1 className="text-2xl font-bold">Sales Assistant</h1>

        <div className="text-sm text-gray-700 bg-gray-50 border rounded p-3 space-y-2">
          <div className="font-semibold">How this AI works</div>

          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Personal memory:</strong> Say{" "}
              <em>“remember this”</em> to save a personal preference. This is
              private to you and does <strong>not</strong> train the dealership
              AI.
            </li>

            <li>
              <strong>Train the dealership brain:</strong> Managers and admins
              can type <em>“add to brain:”</em> followed by approved content to
              train the shared AI.
            </li>

            <li>
              <strong>Automatic compliance:</strong> If your question involves
              APR, payments, leases, rebates, or advertising, the AI will
              automatically apply known compliance rules — even if you don’t ask
              about legality.
            </li>

            <li>
              <strong>Sources:</strong> Answers are labeled as documented dealer
              policy or general dealership guidance so you know how authoritative
              they are.
            </li>
          </ul>
        </div>

        <textarea
          className="w-full p-3 border rounded"
          placeholder="Ask a sales question… (Enter to send)"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m, i) => (
          <div key={m._id || i} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "AI"}
            </div>

            <div className="whitespace-pre-wrap">{m.content}</div>

            {m.source && (
              <div className="text-xs text-gray-500 mt-1">{m.source}</div>
            )}

            {role !== "sales" && m.source_files?.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Sources: {m.source_files.join(", ")}
              </div>
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
