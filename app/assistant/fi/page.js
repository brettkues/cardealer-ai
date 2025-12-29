"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";

/* ================= F&I STEP DEFINITIONS ================= */

const FI_STEPS = [
  {
    step: 1,
    title: "Identify Deal Type",
    summary: "Cash, Finance, or Lease",
    content: `
• Identify whether the deal is Cash, Finance, or Lease.
• This determines downstream compliance, DMV handling, lender steps, and documents.
• User must explicitly select one before proceeding.
`,
  },
  {
    step: 2,
    title: "Enter Deal into DMS",
    summary: "Customer, vehicle, taxes, fees",
    content: `
• Search for the deal by stock number
  OR
• Use Function 20 (lower-left) and search by customer name
• Select the correct customer and vehicle

Taxes:
• Click Tax Group → Select
• Scroll to correct county → Confirm

Rebates:
• Click Rebate
• Enter rebate code and amount
• Repeat as needed

Fees:
• Click Fees / Lender
• Wheelage tax ONLY for new registrations
• EV fee: $175 | Hybrid: $75

AMO:
• Click AMO → Select package

GAP:
• Insurance → GAP → Enter price & cost → Select → OK

Accessories:
• Accessories → Select OR Accessories 1
• Enter retail amount

Service Contracts:
• Select Service Contracts
• Enter “2” (change)
• Verify sale & delivery date = today

Payments:
• First payment = 45 days (avoid 29–31)

Lender:
• Select lender
• APR ≤ buy rate + 2%
• Document exceptions
`,
  },
  {
    step: 3,
    title: "Approvals & Stips",
    summary: "Approval, stips, backend eligibility",
    content: `
• Review lender approval in DealerTrack
• Confirm all stips satisfied
• Verify backend product eligibility
• Confirm rate markup limits
`,
  },
  {
    step: 4,
    title: "Build F&I Menu",
    summary: "MenuSys, products, pricing",
    content: `
• Login MenuSys → Dealer code WI3000
• Sales → New → DMS Import
• Enter stock # → Next
• Verify deal → Next

• Fees & taxes (right)
• Payment terms (bottom left)
• Days to first payment = 45

Product Ratings:
• One check per provider (AUL, Century, ClassicTrac)

Menu:
• 3 service contracts (max → mid → lower)
• Save after each
• GAP typically under $1,000
• Every customer gets 4 oil changes
• Print menu
• DO NOT CLOSE MENUSYS
`,
  },
  {
    step: 5,
    title: "Build Contract",
    summary: "DealerTrack contracting",
    content: `
• DealerTrack F&I → correct approval
• Start Contracting

Verify:
• Names & address match ID
• VIN (critical)

Finance:
• Enter disclosure data exactly

Lease:
• WI → CCR tax
• MN → upfront tax

Fees:
• Service fee → Cash Price Other → Paid to Dealer
• Lien fee → Paid to State

• Save → Submit
`,
  },
  {
    step: 6,
    title: "Compliance Documents",
    summary: "Required forms & waivers",
    content: `
ALL deals:
• Insurance agreement or public liability notice
• MV-11

Finance:
• Credit app
• Approval
• Stips
• Invoice or JD Power
• Product contracts OR waivers

• Print 2 copies
• Never disclose IRS 8300
`,
  },
  {
    step: 7,
    title: "Add Products to DMS",
    summary: "Rebuild contract",
    content: `
• Add sold products
• Rebuild contract
• Match menu selections
`,
  },
  {
    step: 8,
    title: "Signatures",
    summary: "Customer signatures",
    content: `
• Obtain all required signatures
• Verify completeness
`,
  },
  {
    step: 9,
    title: "DMV Processing",
    summary: "Title, plates, temp tags",
    content: `
Out of State:
• Cash → Temp tag only
• Outside finance → Title only + temp tag

• Plate must match inventory
• Write plate on MV-11
• Personalized plates = manual
`,
  },
  {
    step: 10,
    title: "Funding",
    summary: "Submit & fund deal",
    content: `
• Submit for funding
• Track confirmation
`,
  },
  {
    step: 11,
    title: "Deal Recap & Close",
    summary: "Commission, recap, NVDR",
    content: `
• Enter commission
• Recap:
  - F6 buy rate
  - F7 manual reserve if needed
• Accessories → F1
• We Owe → F2
• F24 accept → F90 recap
• Print 2 recaps
• Print NVDR & rebate sheet
• Print sale label
`,
  },
];

/* ================= COMPONENT ================= */

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
`TRAINING TEMPLATE (fill this in, then send):

F&I STEP #: 
Title:
Applies To: (cash / finance / lease / all)
System: (DealerTrack DMS, MenuSys, DMV, etc.)

Objective:
Explain what this step accomplishes.

Exact Steps:
- Click / Action
- Click / Action
- Verification step

Warnings / Critical Notes:
- What must never be missed
- Common mistakes

Completion Check:
How the user knows this step is complete.
`
    );
  }

  async function sendMessage() {
    if (!msg.trim() || loading) return;

    setChat((c) => [{ role: "user", content: msg }, ...c]);
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
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

      {/* TOP GRID */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-white border-b">

        {/* NAV */}
        <div>
          <h2 className="font-bold mb-2">Navigation</h2>
          <ul className="text-sm space-y-1">
            <li><b>start a deal</b></li>
            <li><b>next</b> / <b>back</b></li>
            <li>Ask questions anytime</li>
          </ul>
        </div>

        {/* TRAINING */}
        <div>
          <h2 className="font-bold mb-2">Training</h2>
          <button
            onClick={insertTrainingTemplate}
            className="mb-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Insert Training Template
          </button>
          <p className="text-xs text-gray-600">
            Use <b>ADD TO BRAIN:</b> to store dealership process.
          </p>
        </div>

        {/* STEPS 1–5 */}
        <div>
          <h2 className="font-bold mb-2">F&I Steps</h2>
          {FI_STEPS.filter(s => s.step <= 5).map(s => (
            <div key={s.step} className="mb-2">
              <button
                onClick={() => toggleStep(s.step)}
                className="text-sm font-semibold underline"
              >
                Step {s.step}: {s.title}
              </button>
              {openSteps[s.step] && (
                <div className="text-xs whitespace-pre-wrap mt-1">
                  <b>{s.summary}</b>
                  <div>{s.content}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* STEPS 6–11 */}
        <div>
          {FI_STEPS.filter(s => s.step > 5).map(s => (
            <div key={s.step} className="mb-2">
              <button
                onClick={() => toggleStep(s.step)}
                className="text-sm font-semibold underline"
              >
                Step {s.step}: {s.title}
              </button>
              {openSteps[s.step] && (
                <div className="text-xs whitespace-pre-wrap mt-1">
                  <b>{s.summary}</b>
                  <div>{s.content}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT INPUT */}
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
          className="px-5 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>

      {/* CHAT HISTORY */}
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
