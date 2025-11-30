import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db, storage } from "@/app/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

// PDF text loader utility (calls your readpdf route)
async function loadPdfText(url) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/readpdf?url=${encodeURIComponent(
        url
      )}`
    );
    return await res.text();
  } catch {
    return "";
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { uid, messages } = body;

    if (!uid) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    // ============================
    // 1. LOAD DEALER SETTINGS
    // ============================
    const dealerRef = doc(db, "users", uid, "settings", "dealer");
    const snap = await getDoc(dealerRef);

    if (!snap.exists()) {
      return NextResponse.json(
        { error: "Dealer settings not found" },
        { status: 404 }
      );
    }

    const dealer = snap.data();

    // Deconstruct settings
    const {
      dealerDescription = "",
      aiNotes = "",
      address = "",
      websites = [],
      trainingDocs = [],
      laws = {},
    } = dealer;

    // ============================
    // 2. LOAD PDF TRAINING DOCS
    // ============================
    let trainingText = "";
    for (const pdfUrl of trainingDocs) {
      trainingText += `\n\n--- TRAINING DOC ---\n`;
      trainingText += await loadPdfText(pdfUrl);
    }

    // ============================
    // 3. LOAD ADVERTISING LAWS
    // ============================
    let stateLawText = "";

    // If dealer uploaded a law PDF for their state
    if (laws && laws.stateAdvertising) {
      stateLawText = await loadPdfText(laws.stateAdvertising);
    }

    // If empty → load Wisconsin default
    if (!stateLawText.trim()) {
      if (laws?.wiAdvertising) {
        stateLawText = await loadPdfText(laws.wiAdvertising);
      }
    }

    // ============================
    // 4. BUILD SYSTEM PROMPT (YOUR PERSONALITY)
    // ============================
    const systemPrompt = `
You are the dealership AI assistant for a multi-dealer platform.
Your personality:
- forward-thinking
- blunt honesty
- clever, quick humor
- no sugarcoating
- efficient, clear, and direct

You must follow these rules:

1. Use the dealership's stored knowledge to generate extremely accurate answers.
2. Use the dealer's uploaded advertising laws to ensure legal compliance.
3. Generate the SHORTEST LEGAL DISCLOSURE NECESSARY when asked.
4. If the dealer uploads multiple training docs, use them as reference intelligence.
5. If the user asks for creative content (ads, posts, scripts, etc.), produce high-quality, polished output.
6. NEVER bullshit — if the dealer didn't upload something, say so plainly.

===== DEALER DESCRIPTION =====
${dealerDescription}

===== DEALER NOTES =====
${aiNotes}

===== DEALER ADDRESS =====
${address}

===== DEALER WEBSITES =====
${websites.join(", ")}

===== TRAINING DOCUMENTS (TEXT EXTRACTED) =====
${trainingText}

===== STATE ADVERTISING LAWS =====
${stateLawText}

Respond exactly like Brett:
- no fake politeness
- no corporate fluff
- quick, clever truth
- always accurate
`;

    // ============================
    // 5. CALL OPENAI (GPT-4.1)
    // ============================
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.4,
      stream: true,
    });

    // Stream output
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
