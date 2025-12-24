"use client";

import { useState } from "react";

export default function SalesAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  const role = "manager"; // change to "sales" to hide admin features

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
          role,
          allowSearch,
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const aiMessage = {
        role: "assistant",
        content: data.answer || "No response received.",
        source: data.source || null,
        source_files: data.source_files || [],
        needsSearchApproval: data.needsSearchApproval,
        canSave: data.canSave,
        savePayload: data.savePayload,
        saveSource:
          userMessage.content
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .split(" ")
            .slice(0, 6)
            .join("-") || "admin-note",
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

  async function saveToBrain(messageId, content, source) {
    if (savedIds.has(messageId)) return;
    setSavedIds((s) => new Set([...s, messageId]));

    const res = await fetch("/api/brain/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        source_file: `admin-search:${source}`,
        role,
      }),
    });

    if (!res.ok) {
      setSavedIds((s) => {
        const n = new Set(s);
        n.delete(messageId);
        return n;
      });
      alert("Save failed.");
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
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">Sales Assistant</h1>

        {/* ===== INSTRUCTIONS ===== */}
        <div className="mt-2 text-sm text-gray-700 bg-gray-50 border rounded p-3">
          <div className="font-semibold mb-1">How memory and training work</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              Saying <strong>“remember this”</strong> saves a personal preference
              for you only.
            </li>
            <li>
              Personal memory is not shared and does not train the dealership AI.
            </li>
            <li>
              Managers and admins can train the AI by uploading documents, typing{" "}
              <strong>“add to brain:”</strong> before approved content, or
              approving the AI’s prompt to save results from an internet search.
            </li>
          </ul>
        </div>

        {/* ===== INPUT ===== */}
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
                className="mt-2 ml-4 underline"
                disabled={savedIds.has(m._id)}
                onClick={() =>
                  saveToBrain(m._id, m.savePayload, m.saveSource)
                }
                style={{
                  color: savedIds.has(m._id) ? "#6b7280" : "#16a34a",
                  cursor: savedIds.has(m._id) ? "default" : "pointer",
                }}
              >
                {savedIds.has(m._id) ? "Saved" : "Save to brain"}
              </button>
            )}
          </div>
        ))}

        {loading && <div className="text-sm text-gray-500">AI is typing…</div>}
      </div>
    </div>
  );
}
