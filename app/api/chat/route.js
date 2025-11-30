import { corsHeaders, handleCors } from "@/app/utils/cors";
import { db, storage, auth } from "@/app/firebase";
import { getDocs, collection, query, where, doc, getDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";

// OPENAI — replace with your key stored in env vars if needed
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(request) {
  // ============================
  // CORS PREFLIGHT
  // ============================
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    // ============================
    // READ REQUEST BODY
    // ============================
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

    // ============================
    // LOAD DEALER KNOWLEDGE
    // (Logo, Websites, Laws, PDFs)
    // ============================
    let knowledge = "";

    // ----------------------------
    // 1. LAW TEXT (Primary)
    // ----------------------------
    const lawDoc = await getDoc(doc(db, "lawText", `${uid}_WI`));
    if (lawDoc.exists()) {
      knowledge += `\n\n[WISCONSIN ADVERTISING LAWS]\n${lawDoc.data().text}\n\n`;
    }

    // ----------------------------
    // 2. LAW PDFs (Fallback)
    // ----------------------------
    const pdfQuery = query(
      collection(db, "lawLibrary"),
      where("owner", "==", uid),
      where("state", "==", "WI")
    );
    const pdfSnap = await getDocs(pdfQuery);

    if (!pdfSnap.empty) {
      knowledge += `\n\n[WISCONSIN LAW PDFs]\nDealer has uploaded advertising law PDFs. You must reference them when forming disclosures.\n\n`;
    }

    // ----------------------------
    // 3. DEALER LOGO INFO
    // ----------------------------
    try {
      const logoRef = ref(storage, `logos/${uid}/logo.png`);
      const logoUrl = await getDownloadURL(logoRef);
      knowledge += `\n\n[DEALER LOGO AVAILABLE]\nLogo URL: ${logoUrl}\n\n`;
    } catch {
      knowledge += `\n\n[NO DEALER LOGO UPLOADED]\n\n`;
    }

    // ----------------------------
    // 4. DEALER WEBSITES
    // ----------------------------
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

    // ----------------------------
    // 5. FALLBACK WISCONSIN RULE
    // ----------------------------
    if (!lawDoc.exists() && pdfSnap.empty) {
      knowledge += `
[DEFAULT WISCONSIN DISCLOSURE RULE]
If any advertisement mentions price, APR, or payment, 
you MUST add a disclosure such as:
"All offers subject to tax, title, license & fees. See dealer for details."
`;
    }

    // ============================
    // BUILD SYSTEM PROMPT
    // ============================
    const systemPrompt = `
You are the AI assistant for a car dealership.
You MUST answer using the dealer’s own rules, laws, PDFs, policies, knowledge, and website data.

You MUST obey:
1. Wisconsin advertising law (fallback if no dealer laws uploaded).
2. Dealer-uploaded law text.
3. Dealer-uploaded PDFs (assume they contain rules).
4. Dealer websites and inventory structures.
5. The fact that the user is a dealership employee, not a retail consumer.

THE MOST IMPORTANT RULE:
If the user asks anything involving PRICE, APR, PAYMENT, DISCLAIMERS, or SOCIAL POSTS —
you MUST follow Wisconsin ad law OR the dealer’s uploaded law PDFs/text.

Here is the dealer’s knowledge base:
${knowledge}
`;

    // ============================
    // SEND TO OPENAI
    // ============================
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",  // lightweight + powerful
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
      }),
    });

    const data = await openaiResponse.json();

    // If OpenAI fails
    if (!data.choices || !data.choices[0]) {
      return new Response(
        JSON.stringify({ error: "AI response failed." }),
        { status: 500, headers: corsHeaders() }
      );
    }

    const answer = data.choices[0].message.content;

    // ============================
    // RETURN ANSWER
    // ============================
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
