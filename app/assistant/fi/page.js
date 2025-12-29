"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef(null);

  const role = "manager";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

      if (!res.ok) throw new Error("Chat failed");

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
          content: "Something went wrong. Try again.",
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
      {/* HEADER */}
      <div className="p-4 border-b bg-white">
        <h1 className="text-2xl font-bold">F&I Assistant</h1>
        <p className="text-sm text-gray-600">
          Guided F&I workflow + dealership brain
        </p>
      </div>

      {/* FOUR COLUMN GRID */}
      <div className="grid grid-cols-4 flex-1 overflow-hidden">

        {/* COLUMN 1 – CHAT */}
        <div className="col-span-1 flex flex-col border-r bg-gray-50">
          <div className="flex-1 overflow-auto p-3">
            {chat.map((m, i) => (
              <div key={i} className="mb-4">
                <div className="font-semibold">
                  {m.role === "user" ? "You" : "F&I Assistant"}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.source && (
                  <div className="text-xs text-gray-500 mt-1">
                    {m.source}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3 bg-white">
            <textarea
              className="w-full p-2 border rounded"
              placeholder="Ask, ADD TO BRAIN:, or start a deal…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={loading}
            />
            {loading && (
              <div className="text-xs text-gray-500 mt-1">
                AI is typing…
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2 – TRAINING */}
        <div className="col-span-1 border-r bg-white p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Training</h2>

          <details open className="mb-4">
            <summary className="cursor-pointer font-medium">
              How to Train the Brain
            </summary>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-2">
ADD TO BRAIN:
F&I STEP X – [Step name]

• Clear, procedural steps
• One action per line
• This becomes dealership policy
            </pre>
          </details>

          <details className="mb-4">
            <summary className="cursor-pointer font-medium">
              Memory Rules
            </summary>
            <ul className="text-sm mt-2 space-y-1">
              <li>• ADD TO BRAIN = dealership knowledge</li>
              <li>• Remember this = personal notes only</li>
            </ul>
          </details>
        </div>

        {/* COLUMN 3 – STEP OVERVIEW */}
        <div className="col-span-1 border-r bg-gray-50 p-4 overflow-auto">
          <h2 className="font-semibold mb-3">F&I Steps</h2>
          <ol className="text-sm space-y-1 list-decimal ml-4">
            <li>Identify deal type</li>
            <li>Enter deal into DMS</li>
            <li>Approvals & stips</li>
            <li>Build F&I menu</li>
            <li>Build contract</li>
            <li>Compliance docs</li>
            <li>Add products / rebuild</li>
            <li>Signatures</li>
            <li>DMV</li>
            <li>Funding</li>
            <li>Deal recap & cap</li>
          </ol>
        </div>

        {/* COLUMN 4 – ACTIVE STEP GUIDANCE */}
        <div className="col-span-1 bg-white p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Navigation</h2>
          <ul className="text-sm space-y-2">
            <li>• <b>start a deal</b> — begin workflow</li>
            <li>• Step 1 auto-advances after deal type</li>
            <li>• <b>next</b> — move forward</li>
            <li>• <b>back</b> — return to prior step</li>
            <li>• Ask questions anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
