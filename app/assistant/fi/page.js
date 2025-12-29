"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const topRef = useRef(null);

  const role = "manager"; // sales | manager | admin

  // Scroll newest messages to top (Sales-style behavior)
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };
    setChat((c) => [userMessage, ...c]);
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
        {
          role: "assistant",
          content: data.answer,
          source: data.source,
        },
        ...c,
      ]);
    } catch {
      setChat((c) => [
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
        ...c,
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
          <p><b>GUIDED DEAL MODE</b></p>
          <p>• Type <b>start a deal</b> to begin the F&I workflow</p>
          <p>• Answer prompts as requested (ex: cash / finance / lease)</p>
          <p>• Type <b>next</b> when a step is complete</p>
          <p>• Type <b>back</b> to return to the previous step</p>
          <p>• You may ask questions at any step without advancing</p>

          <hr className="my-2" />

          <p><b>TRAINING THE BRAIN</b> (Managers/Admins)</p>
          <p>
            • To add dealership policy or process:<br />
            <b>ADD TO BRAIN: [training content]</b>
          </p>
          <p>
            • To have the assistant WRITE training for you:<br />
            <b>Write training for F&amp;I Step X about [topic]</b>
          </p>
          <p>
            • Review the output, then copy &amp; paste it back using
            <br />
            <b>ADD TO BRAIN:</b>
          </p>

          <hr className="my-2" />

          <p><b>PERSONAL NOTES</b></p>
          <p>• <b>Remember this:</b> saves a personal note (not dealership policy)</p>
        </div>

        <textarea
          className="w-full p-3 border rounded mt-2"
          placeholder="Ask a question, start a deal, or ADD TO BRAIN…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <div ref={topRef} />

        {loading && (
          <div className="text-sm text-gray-500 mb-4">AI is typing…</div>
        )}

        {chat.map((m, i) => (
          <div key={i} className="mb-6">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "F&I Assistant"}
            </div>

            <div className="whitespace-pre-wrap">{m.content}</div>

            {m.source && (
              <div className="text-xs text-gray-500 mt-1">{m.source}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
