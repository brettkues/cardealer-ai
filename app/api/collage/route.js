export const runtime = "nodejs"; // Required for Sharp

import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const { imageUrls, ribbonText } = await req.json();

    if (!imageUrls || imageUrls.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 images are required." },
        { status: 400 }
      );
    }

    // Download all 4 images
    const buffers = await Promise.all(
      imageUrls.map(async (url) => {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        return Buffer.from(await res.arrayBuffer());
      })
    );

    // Resize to 425x425
    const resized = await Promise.all(
      buffers.map((img) =>
        sharp(img)
          .resize(425, 425, { fit: "cover" })
          .jpeg({ quality: 90 })
          .toBuffer()
      )
    );

    // Build collage
    const collage = sharp({
      create: {
        width: 850,
        height: 850,
        channels: 3,
        background: "#ffffff",
      },
    }).composite([
      { input: resized[0], left: 0, top: 0 },
      { input: resized[1], left: 425, top: 0 },
      { input: resized[2], left: 0, top: 425 },
      { input: resized[3], left: 425, top: 425 },
    ]);

    const output = await collage.jpeg({ quality: 90 }).toBuffer();

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate collage." },
      { status: 500 }
    );
  }
}
