"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [openSteps, setOpenSteps] = useState({});

  const role = "manager";

  function toggleStep(step) {
    setOpenSteps((s) => ({ ...s, [step]: !s[step] }));
  }

  function insertTrainingTemplate() {
    setMsg(
`ADD TO BRAIN:
F&I STEP X – [Title]

• Action-by-action instructions
• Exact buttons, fields, menus
• One instruction per line`
    );
  }

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
        { role: "assistant", content: "Something went wrong." },
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
    <div className="h-screen flex flex-col bg-gray-100">

      {/* ===== TOP 4-COLUMN HEADER ===== */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b">

        {/* NAV */}
        <div className="border-r pr-3">
          <h2 className="font-bold mb-2">Navigation</h2>
          <ul className="text-sm space-y-1">
            <li><b>start a deal</b></li>
            <li><b>next</b> / <b>back</b></li>
            <li>Ask questions anytime</li>
          </ul>
        </div>

        {/* TRAINING */}
        <div className="border-r pr-3">
          <h2 className="font-bold mb-2">Training</h2>
          <button
            onClick={insertTrainingTemplate}
            className="mb-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Insert Training Template
          </button>
          <p className="text-xs text-gray-600">
            Managers/Admins only.  
            Use <b>ADD TO BRAIN:</b> to store dealership process.
          </p>
        </div>

        {/* STEPS 1–5 */}
        <div className="border-r pr-3">
          <h2 className="font-bold mb-2">F&I Steps</h2>
          {[1,2,3,4,5].map((s) => (
            <div key={s} className="mb-1">
              <button
                onClick={() => toggleStep(s)}
                className="text-sm font-semibold underline"
              >
                Step {s}
              </button>
              {openSteps[s] && (
                <div className="text-xs text-gray-700 mt-1">
                  Detailed guidance available in assistant.
                </div>
              )}
            </div>
          ))}
        </div>

        {/* STEPS 6–11 */}
        <div>
          <h2 className="font-bold mb-2">&nbsp;</h2>
          {[6,7,8,9,10,11].map((s) => (
            <div key={s} className="mb-1">
              <button
                onClick={() => toggleStep(s)}
                className="text-sm font-semibold underline"
              >
                Step {s}
              </button>
              {openSteps[s] && (
                <div className="text-xs text-gray-700 mt-1">
                  Detailed guidance available in assistant.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== CHAT INPUT (ALWAYS VISIBLE) ===== */}
      <div className="bg-white border-b p-4 flex gap-2">
        <textarea
          className="flex-1 p-3 border rounded"
          placeholder="Ask a question, ADD TO BRAIN:, or start a deal…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>

      {/* ===== CHAT HISTORY ===== */}
      <div className="flex-1 overflow-auto p-4">
        {chat.map((m, i) => (
          <div key={i} className="mb-4">
            <div className="font-semibold">
              {m.role === "user" ? "You" : "F&I Assistant"}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.source && (
              <div className="text-xs text-gray-500">{m.source}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
