"use client";

import { useState } from "react";
import { auth } from "@/lib/firebaseClient";
const FI_STEPS = [
  {
    step: 1,
    title: "Identify Deal Type",
    summary: "Cash, Finance, or Lease",
    content: `
• Identify whether the deal is Cash, Finance, or Lease.
• This determines downstream compliance, DMV handling, lender steps, and documents.
• User must explicitly select one before proceeding.
`
  },
  {
    step: 2,
    title: "Enter Deal into DMS",
    summary: "Customer, vehicle, taxes, fees",
    content: `
To enter a deal into the DMS:

• Search for the deal by stock number
  OR
• Use Function 20 (lower-left) and search by customer name
• Select the correct customer and vehicle

Taxes:
• Click Tax Group
• Click Select
• Scroll until the correct county is found
• Confirm the selection

Rebates (new vehicles):
• Click Rebate
• Enter rebate code and amount
• Repeat for additional rebates

Fees:
• Click Fees / Lender
• Select required fees
• Wheelage tax applies ONLY to new registrations
• Electric vehicle fee: $175
• Hybrid fee: $75
• Click OK when complete

AMO:
• Click AMO
• Select the package chosen by the customer

GAP:
• Click Insurance
• Select GAP
• Enter price and cost
• Mark selected and click OK

Accessories:
• Click Accessories
• Select listed accessories OR use Accessories 1 if not listed
• Enter retail amount on next screen

Service Contracts:
• Select Service Contracts
• Enter “2” (change) next to desired contract
• Complete required information
• Verify sale and delivery date = today

Payment:
• First payment should be 45 days
• May extend slightly if day 45 lands on 29–31

Lender:
• Select lender from list
• APR must be buy rate + 2% or less
• If less, Fair Credit Participation form must document why
`
  },
  {
    step: 3,
    title: "Approvals & Stips",
    summary: "Approval, stips, backend eligibility",
    content: `
• Review lender approval in DealerTrack
• Confirm all stipulations are satisfied
• Verify backend products allowed by lender
• Confirm rate markup limits
• Ensure approval matches deal structure before proceeding
`
  },
  {
    step: 4,
    title: "Build F&I Menu",
    summary: "MenuSys, products, pricing",
    content: `
MenuSys Process:

• Log into MenuSys
• Dealer code: WI3000
• Sales tab → New → DMS Import
• Enter stock number → Next
• Verify deal data → Next

• Enter fees and taxes (right side)
• Enter payment terms (bottom left)
• Verify days to first payment = 45
• Verify deal matches DMS → Next

Product Ratings:
• Ensure one checkmark in each rating column (AUL, Century, ClassicTrac)
• Verify vehicle data → Next
• Close “rates retrieved” popup

Menu Build:
• Select 3 service contracts:
  1) Max coverage matching term & miles
  2) Same coverage, reduced term/miles
  3) Same term/miles, reduced coverage
• Save after each selection

• Add GAP and other products
• GAP typically safe under $1,000 (lender dependent)

• Every customer gets 4 oil changes
• Add to maintenance log after deal

• Arrange menu presentation order
• Preferred = maximum protection
• Print menu
• DO NOT CLOSE MENUSYS — return later
`
  },
  {
    step: 5,
    title: "Build Contract",
    summary: "DealerTrack contracting",
    content: `
• In DealerTrack F&I screen, select correct approval
• Click Start Contracting

Verification:
• Verify names, middle names, addresses match driver’s license
• Correct or document differences
• Verify VIN (CRITICAL)

Finance Deals:
• Enter rate, finance charge, amount financed, total of payments from DMS disclosure

Lease Deals:
• WI: Capitalized cost reduction tax
• MN: Upfront sales tax
• These may be capitalized

Fees:
• Service / Document fee → Add Other Fees
  - Charge to: Cash Price Other
  - Paid to: Dealer
• Lien fee → Paid to State

• Save
• Resolve errors if prompted
• Submit for verification
`
  },
  {
    step: 6,
    title: "Compliance Documents",
    summary: "Required forms & waivers",
    content: `
Required on ALL deals:
• Agreement to Provide Insurance OR Public Liability Notice (cash)
• MV-11 Title Application

Finance deals additionally require:
• Signed credit application
• Bank approval
• All stips satisfied
• Invoice or JD Power book-out
• Product contracts or signed waivers

MenuSys Documents:
• If product sold → Print contract
• If declined → Print waiver
• Print TWO copies of everything
• Never disclose filing of IRS 8300
`
  },
  {
    step: 7,
    title: "Add Products to DMS",
    summary: "Rebuild contract",
    content: `
• Add sold products into DMS
• Rebuild contract
• Ensure all backend products reflect menu selections
`
  },
  {
    step: 8,
    title: "Signatures",
    summary: "Customer signatures",
    content: `
• Obtain all required customer signatures
• Verify completeness before proceeding
`
  },
  {
    step: 9,
    title: "DMV Processing",
    summary: "Title, plates, temp tags",
    content: `
Out-of-State:
• Cash deal → Temp tag only
• Outside finance → Title only, then create temp tag

• Verify issued plate matches inventory plate
• Write plate number on MV-11
• Personalized plates require manual processing
`
  },
  {
    step: 10,
    title: "Funding",
    summary: "Submit & fund deal",
    content: `
• Submit deal for funding
• Track lender funding confirmation
`
  },
  {
    step: 11,
    title: "Deal Recap & Close",
    summary: "Commission, recap, NVDR",
    content: `
• Enter salesperson commission (Commissions tab)
• Recap:
  - Function 6 → Enter buy rate
  - If reserve fails → Function 7 → Enter manual reserve
• Accessories → Function 1
• We Owe → Function 2
• Function 24 → Accept
• Function 90 → Recap
• Print 2 recaps
• Print NVDR (new vehicles)
• Print rebate sheet
• Print sale label
`
  }
];
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
