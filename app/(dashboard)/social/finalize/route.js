import { NextResponse } from "next/server";
import { adminStorage } from "../../../../lib/firebaseAdmin";
import { openai } from "../../../../lib/ai/openai";
import { createCanvas, loadImage } from "canvas";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { images, caption, logos, season } = body;

    if (!images || images.length !== 4) {
      return NextResponse.json({ error: "Four images required." }, { status: 400 });
    }

    // 1) Generate ribbon using OpenAI
    const aiPrompt = `
Create a ribbon banner graphic appropriate for the season: "${season}".
Include this caption: "${caption}".
Should be dealership-professional.
`;

    const aiImage = await openai.images.generate({
      model: "gpt-image-1",
      prompt: aiPrompt,
      size: "512x128"
    });

    const ribbonBase64 = aiImage.data[0].b64_json;
    const ribbonBuffer = Buffer.from(ribbonBase64, "base64");

    // 2) Build final 850x850 JPG
    const canvas = createCanvas(850, 850);
    const ctx = canvas.getContext("2d");

    const loaded = await Promise.all(images.map((url) => loadImage(url)));

    ctx.drawImage(loaded[0], 0, 0, 425, 425);
    ctx.drawImage(loaded[1], 425, 0, 425, 425);
    ctx.drawImage(loaded[2], 0, 425, 425, 425);
    ctx.drawImage(loaded[3], 425, 425, 425, 425);

    const ribbonImage = await loadImage(ribbonBuffer);
    ctx.drawImage(ribbonImage, 0, 350, 850, 150);

    // 3) Add up to 3 logos
    if (logos && logos.length > 0) {
      let x = 20;
      for (const logo of logos.slice(0, 3)) {
        try {
          const img = await loadImage(logo);
          ctx.drawImage(img, x, 20, 120, 60);
          x += 140;
        } catch {}
      }
    }

    // 4) Export JPG
    const buffer = canvas.toBuffer("image/jpeg");
    const filename = `final-social-image-${Date.now()}.jpg`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, { contentType: "image/jpeg" });

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
