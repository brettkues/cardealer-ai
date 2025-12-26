// app/assistant/fi/page.js

"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef(null);

  const role = "manager"; // sales | manager | admin

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };
    setChat((c) => [...c, userMessage]);
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
          userId: auth.currentUser?.uid || "fi-user",
          sessionId,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();

      setChat((c) => [
        ...c,
        {
          role: "assistant",
          content: data.answer,
          source: data.source,
        },
      ]);
    } catch {
      setChat((c) => [
        ...c,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
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
      {/* HEADER / DIRECTIONS */}
      <div className="p-4 border-b bg-white space-y-2">
        <h1 className="text-2xl font-bold">F&I Assistant</h1>

        <div className="text-sm text-gray-700 space-y-1">
          <p>
            • To begin a deal-guided workflow, type <b>start a deal</b>
          </p>
          <p>
            • Follow each step and type <b>next</b> when the step is complete
          </p>
          <p>
            • You may ask questions at any step (the process will not advance)
          </p>
          <p>
            • Managers/Admins can train the brain using:
            <br />
            <b>ADD TO BRAIN: [your instruction]</b>
          </p>
          <p>
            • “Remember this” saves personal notes only (not dealership policy)
          </p>
        </div>

        <textarea
          className="w-full p-3 border rounded mt-2"
          placeholder="Type a question, ADD TO BRAIN:, or start a deal…"
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
          <div key={i} className="mb-5">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "F&I Assistant"}
            </div>

            <div className="whitespace-pre-wrap">{m.content}</div>

            {m.source && (
              <div className="text-xs text-gray-500 mt-1">{m.source}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-sm text-gray-500">AI is typing…</div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
