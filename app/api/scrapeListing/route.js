import { NextRequest, NextResponse } from "next/server";

export async function POST(req = new NextRequest()) {
  try {
    const { messages, imageDataUrl, systemPrompt } = await req.json();

    if (!messages || !systemPrompt) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const apiMessages = [];

    apiMessages.push({ role: "system", content: systemPrompt });

    for (const msg of messages) {
      if (msg.role === "user" && imageDataUrl) {
        const textPart = msg.content || "";

        const contentParts = [];
        if (textPart.trim()) {
          contentParts.push({ type: "text", text: textPart });
        }

        contentParts.push({
          type: "image_url",
          image_url: { url: imageDataUrl },
        });

        apiMessages.push({ role: "user", content: contentParts });
      } else {
        apiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Missing OpenAI API key");

    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-vision",
        messages: apiMessages,
        temperature: 0.7,
      }),
    });

    if (!openAiRes.ok) {
      const err = await openAiRes.text();
      return NextResponse.json(
        { error: "OpenAI API call failed", details: err },
        { status: 500 }
      );
    }

    const completion = await openAiRes.json();
    const assistantReply = completion?.choices?.[0]?.message?.content;

    if (!assistantReply) {
      return NextResponse.json({ error: "No reply from AI" }, { status: 500 });
    }

    return NextResponse.json({ reply: assistantReply });
  } catc
