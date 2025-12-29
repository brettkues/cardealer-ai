"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";

const FI_STEPS = [
  { step: 1, title: "Identify Deal Type", summary: "Cash, Finance, or Lease." },
  { step: 2, title: "Enter Deal into DMS", summary: "Customer, vehicle, taxes, fees." },
  { step: 3, title: "Approvals & Stips", summary: "Approval, stips, backend eligibility." },
  { step: 4, title: "Build F&I Menu", summary: "MenuSys, products, pricing, save menu." },
  { step: 5, title: "Build Contract", summary: "DealerTrack contract creation." },
  { step: 6, title: "Compliance Documents", summary: "All required forms & waivers." },
  { step: 7, title: "Add Products to DMS", summary: "Rebuild contract with products." },
  { step: 8, title: "Signatures", summary: "Customer signatures complete." },
  { step: 9, title: "DMV Processing", summary: "Title, plates, temp tags." },
  { step: 10, title: "Funding", summary: "Submit & fund deal." },
  { step: 11, title: "Deal Recap & Close", summary: "Commission, recap, NVDR, label." },
];

export default function FIAssistant() {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [openSteps, setOpenSteps] = useState([]);

  const role = "manager";

  function toggleStep(step) {
    setOpenSteps((prev) =>
      prev.includes(step)
        ? prev.filter((s) => s !== step)
        : [...prev, step]
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
        { role: "assistant", content: data.answer, source: data.source },
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

  function insertTrainingTemplate() {
    setMsg(
`TRAINING TEMPLATE

F&I STEP #:
Title:
Applies To:
System:

Objective:
Exact Steps:
Warnings / Critical Notes:
Completion Check:
`
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b bg-white space-y-4">
        <h1 className="text-2xl font-bold">F&I Assistant</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
          {/* GUIDED MODE */}
          <div>
            <h2 className="font-semibold mb-2">Guided Deal Mode</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><b>start a deal</b> to begin</li>
              <li><b>next</b> advances step</li>
              <li><b>back</b> returns to prior step</li>
              <li>Ask about any step anytime</li>
            </ul>
          </div>

          {/* TRAINING */}
          <div>
            <h2 className="font-semibold mb-2">Training</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><b>ADD TO BRAIN:</b> saves training</li>
              <li>Assistant can write training</li>
              <li>Use template for consistency</li>
            </ul>

            <button
              onClick={insertTrainingTemplate}
              className="mt-3 px-3 py-2 text-sm bg-blue-600 text-white rounded"
            >
              Insert Training Template
            </button>
          </div>

          {/* STEP SUMMARY */}
          <div>
            <h2 className="font-semibold mb-2">F&I Steps</h2>
            <div className="space-y-1">
              {FI_STEPS.map((s) => (
                <div key={s.step} className="border rounded">
                  <button
                    onClick={() => toggleStep(s.step)}
                    className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 font-medium"
                  >
                    Step {s.step}: {s.title}
                  </button>
                  {openSteps.includes(s.step) && (
                    <div className="px-3 py-2 text-xs text-gray-600 bg-white">
                      {s.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <textarea
          className="w-full p-3 border rounded"
          placeholder="Ask a question, start a deal, or add training…"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          disabled={loading}
        />
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {loading && <div className="text-sm text-gray-500">AI is typing…</div>}

        {chat.map((m, i) => (
          <div key={i} className="mb-6">
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
