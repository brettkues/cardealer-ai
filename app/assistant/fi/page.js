"use client";

import { useState } from "react";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const role = "manager"; // sales | manager | admin

  async function sendMessage() {
    if (!msg || loading) return;

    const userMessage = {
      role: "user",
      content: msg,
      _id: `${Date.now()}-user`,
    };

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
  domain: "fi",
  userId: "fi-session",
}),

      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response.",
        source: data.source || null,
        source_files: Array.isArray(data.source_files)
          ? data.source_files
          : [],
        _id: `${Date.now()}-ai`,
      };

      setChat([aiMessage, ...newChat]);
    } catch {
      setChat([
        {
          role: "assistant",
          content: "Something went wrong.",
          source_files: [],
          _id: `${Date.now()}-error`,
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
      {/* TOP BAR */}
      <div className="p-4 border-b bg-white space-y-2">
        <h1 className="text-2xl font-bold">F&amp;I Assistant</h1>

        <div className="text-sm text-gray-600">
          <strong>How this assistant works:</strong>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>
              Ask questions like <em>“What’s next?”</em> or{" "}
              <em>“What forms do I need?”</em>
            </li>
            <li>
              Compliance answers come only from documented dealership policy.
            </li>
            <li>
              To train the AI, managers/admins must type:
              <br />
              <code className="bg-gray-100 px-1 py-0.5 rounded">
                add to brain:
              </code>
            </li>
            <li>
              Questions never change deal state. Only explicit actions do.
            </li>
          </ul>
        </div>

        <textarea
          className="w-full p-3 border rounded mt-2"
          placeholder="Ask an F&I question… (Enter to send)"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {chat.map((m) => (
          <div key={m._id} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "AI"}
            </div>

            <div className="whitespace-pre-wrap">{m.content}</div>

            {m.source && (
              <div className="text-xs text-gray-500 mt-1">
                {m.source}
              </div>
            )}

            {role !== "sales" &&
              Array.isArray(m.source_files) &&
              m.source_files.length > 0 && (
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
