export const runtime = "nodejs";         // REQUIRED for Firebase
export const dynamic = "force-dynamic";  // REQUIRED to avoid static optimization
export const maxDuration = 60;           // Prevent Vercel timeout

import { corsHeaders, handleCors } from "@/app/utils/cors";
import { db, storage, auth } from "@/app/utils/firebase";   // FIXED PATH
import { getDocs, collection, query, where, doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { userMessage, uid } = await request.json();

    if (!uid) {
      return new Response(
        JSON.stringify({ error: "Missing user ID." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!userMessage || userMessage.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // ----------------------------
    // LOAD KNOWLEDGE
    // ----------------------------
    let knowledge = "";

    const lawDoc = await getDoc(doc(db, "lawText", `${uid}_WI`));
    if (lawDoc.exists()) {
      knowledge += `\n\n[WISCONSIN ADVERTISING LAW]\n${lawDoc.data().text}\n\n`;
    }

    const pdfQuery = query(
      collection(db, "lawLibrary"),
      where("owner", "==", uid),
      where("state", "==", "WI")
    );
    const pdfSnap = await getDocs(pdfQuery);

    if (!pdfSnap.empty) {
      knowledge += `\n\n[WISCONSIN LAW PDFs]\nDealer has uploaded advertising law PDFs.\n\n`;
    }

    try {
      const logoRef = ref(storage, `logos/${uid}/logo.png`);
      const logoUrl = await getDownloadURL(logoRef);
      knowledge += `\n\n[DEALER LOGO]\n${logoUrl}\n\n`;
    } catch {
      knowledge += `\n\n[NO LOGO]\n\n`;
    }

    const siteQuery = query(
      collection(db, "dealerWebsites"),
      where("owner", "==", uid)
    );
    const siteSnap = await getDocs(siteQuery);

    if (!siteSnap.empty) {
      knowledge += "\n\n[DEALER WEBSITES]\n";
      siteSnap.forEach(d => {
        knowledge += `• ${d.data().url}\n`;
      });
      knowledge += "\n";
    }

    if (!lawDoc.exists() && pdfSnap.empty) {
      knowledge += `
[DEFAULT WI DISCLOSURE]
If price, APR, or payment is referenced:
"All offers subject to tax, title, license & fees. See dealer for details."
`;
    }

    // ----------------------------
    // SYSTEM PROMPT
    // ----------------------------
    const systemPrompt = `
You are the AI assistant for a car dealership.
You MUST follow Wisconsin law and the dealer's uploaded policies.

Dealer Knowledge:
${knowledge}
`;

    // ----------------------------
    // OPENAI REQUEST
    // ----------------------------
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
      }),
    });

    const data = await openaiResponse.json();

    if (!data.choices || !data.choices[0]) {
      return new Response(
        JSON.stringify({ error: "AI response failed." }),
        { status: 500, headers: corsHeaders() }
      );
    }

    const answer = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
