export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { corsHeaders, handleCors } from "../../utils/cors";

export async function POST(request) {
  // CORS preflight
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
Answer clearly and professionally, using expertise in automotive sales, leasing, service, 
marketing, inventory, customer handling, and real dealership operations.
Keep responses accurate, direct, and relevant.
    `;

    // Make request
