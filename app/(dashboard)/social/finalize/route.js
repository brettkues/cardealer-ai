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
    const ctx = canvas.getContext("2d");

    // Load & draw the four selected vehicle images
    const loaded = await Promise.all(images.map((url) => loadImage(url)));

    ctx.drawImage(loaded[0], 0, 0, 425, 425);
    ctx.drawImage(loaded[1], 425, 0, 425, 425);
    ctx.drawImage(loaded[2], 0, 425, 425, 425);
    ctx.drawImage(loaded[3], 425, 425, 425, 425);

    // Draw ribbon across the middle
    const ribbonImage = await loadImage(ribbonBuffer);
    ctx.drawImage(ribbonImage, 0, 350, 850, 150);

    // ---------------------------
    // 3) Add logos (if any)
    // ---------------------------
    if (logos && logos.length > 0) {
      let x = 20;
      for (const logo of logos.slice(0, 3)) {
        try {
          const logoImg = await loadImage(logo);
          ctx.drawImage(logoImg, x, 20, 120, 60);
          x += 140;
        } catch {}
      }
    }

    // ---------------------------
    // 4) Export final JPG
    // ---------------------------
    const buffer = canvas.toBuffer("image/jpeg");
    const filename = `final-social-image-${Date.now()}.jpg`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
      contentType: "image/jpeg"
    });

    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: "03-01-2035"
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Finalize error:", err);
    return NextResponse.json(
      { error: "Unable to generate final image." },
      { status: 500 }
    );
  }
}
