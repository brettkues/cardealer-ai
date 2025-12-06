import { NextResponse } from "next/server";
import { adminStorage } from "../../../../../lib/firebaseAdmin";
import { openai } from "../../../../../lib/ai/openai";
import { createCanvas, loadImage } from "canvas";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { images, caption, logos, season } = body;

    // Basic validation
    if (!images || images.length !== 4) {
      return NextResponse.json({ error: "Four images required." }, { status: 400 });
    }

    // ---------------------------
    // 1) Generate ribbon with OpenAI
    // ---------------------------
    const aiPrompt = `
Create a ribbon banner graphic appropriate for the season: "${season}".
It must include this caption text: "${caption}".
It must be clean, dealership-professional, and work as an overlay on social media images.
`;

    const aiImage = await openai.images.generate({
      model: "gpt-image-1",
      prompt: aiPrompt,
      size: "512x128"
    });

    const ribbonBase64 = aiImage.data[0].b64_json;
    const ribbonBuffer = Buffer.from(ribbonBase64, "base64");

    // ---------------------------
    // 2) Canvas: build final 850×850 JPG
    // ---------------------------
    const canvas = createCanvas(850, 850);
    const ctx = canv
