export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { corsHeaders, handleCors } from "@/app/utils/cors";

export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { userMessage } = await request.json();

    if (!userMessage || userMessage.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    const systemPrompt = `
You are Dealer AI Assistant. 
Answer clearly and professionally, using your knowledge of car sales, service, leasing, 
inventory, financing, customer handling, and automotive retail operations.
Keep responses accurate, direct, and relevant.
    `;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 300
      })
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0]) {
      return new Response(
        JSON.stringify({ error: "AI did not return a response." }),
        { status: 500, headers: corsHeaders() }
      );
    }

    return new Response(
      JSON.stringify({ answer: data.choices[0].message.content }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
