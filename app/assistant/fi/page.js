"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebaseClient";

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const role = "manager"; // sales | manager | admin

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    const userMessage = { role: "user", content: msg };
    setChat((c) => [userMessage, ...c]); // newest at top
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
      <div className="p-4 border-b bg-white space-y-3">
        <h1 className="text-2xl font-bold">F&amp;I Assistant</h1>

        <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
          <p className="font-semibold">How to use this assistant:</p>

          <p>
            • To run a guided F&amp;I workflow, type <b>start a deal</b>
          </p>
          <p>
            • Step 1 will ask for the deal type (cash / finance / lease)
          </p>
          <p>
            • Each step will either:
            <br />
            &nbsp;&nbsp;– ask for details, or<br />
            &nbsp;&nbsp;– instruct you to type <b>next</b> when complete
          </p>
          <p>
            • You may type <b>back</b> to return to the previous step
          </p>

          <hr />

          <p className="font-semibold">How to train the F&amp;I brain:</p>

          <p>
            • To add permanent dealership knowledge, use:
            <br />
            <b>ADD TO BRAIN:</b> followed by the instruction
          </p>

          <p>
            • To train a <b>specific step</b>, always include the step label:
            <br />
            <b>ADD TO BRAIN: F&amp;I STEP 3 – Entering a cash deal into the DMS…</b>
          </p>

          <p>
            • Step-based training is available:
            <br />
            – During an active deal<br />
            – Outside a deal (lookup mode)
          </p>

          <p>
            • Questions like:
            <br />
            <i>“How do I change the tax county?”</i><br />
            will pull the exact step training if it exists
          </p>

          <hr />

          <p className="font-semibold">Important notes:</p>

          <p>
            • “Remember this” saves <u>personal notes only</u>
          </p>
          <p>
            • Only <b>ADD TO BRAIN</b> updates dealership policy
          </p>
          <p>
            • This assistant will never advance steps unless you type <b>next</b>
          </p>
        </div>

        <textarea
          className="w-full p-3 border rounded mt-2"
          placeholder="Ask a question, ADD TO BRAIN:, or type start a deal…"
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

        {loading && (
          <div className="text-sm text-gray-500">AI is typing…</div>
        )}
      </div>
    </div>
  );
}
