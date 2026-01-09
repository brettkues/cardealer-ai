"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebaseClient";

export default function SalesAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const role = "manager";

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };
    const newChat = [userMessage, ...chat];

    setChat(newChat);
    setMsg("");
    setLoading(true);

    try {
      const context = newChat
        .slice(0, 10)
        .map(m =>
          `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`
        );

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          role,
          domain: "sales",
          userId: auth.currentUser?.uid || "sales-user",
          sessionId,
          context,
        }),
      });

      const data = await res.json();

      setChat([
        {
          role: "assistant",
          content: data.answer,
          source: data.source || null,
          source_files: data.source_files || [],
          _id: crypto.randomUUID(),
        },
        ...newChat,
      ]);
    } catch {
      setChat([
        {
          role: "assistant",
          content: "Sales assistant failed.",
        },
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
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold">Sales Assistant</h1>
          <Link
            href="/assistant/sales#rules"
            className="text-sm text-blue-600 underline"
          >
            Rules for Assistant
          </Link>
        </div>
      </div>

      <div id="rules" className="p-4 border-b bg-gray-50">
        <div className="text-sm text-gray-700 bg-white border rounded p-3 space-y-2">
          <div className="font-semibold">How this assistant works</div>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal memory:</strong> Say <em>“remember this”</em> to save a personal preference.</li>
            <li><strong>Train the dealership brain:</strong> Start message with <em>“add to brain:”</em></li>
            <li><strong>Compliance guardrails:</strong> Required for APR, pricing, etc.</li>
            <li><strong>Sources:</strong> Shown with each answer.</li>
          </ul>
        </div>

        <div className="flex gap-2 mt-3">
          <textarea
            className="flex-1 p-3 border rounded"
            placeholder="Ask a sales question… (Enter to send)"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m) => (
          <div key={m._id} className="mb-6">
            <div className="font-semibold">{m.role === "user" ? "You" : "AI"}</div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.source && <div className="text-xs text-gray-500 mt-1">{m.source}</div>}
            {role !== "sales" && m.source_files?.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Sources: {m.source_files.join(", ")}
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">AI is typing…</div>}
      </div>
    </div>
  );
}
