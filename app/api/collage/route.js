export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import sharp from "sharp";
import fetch from "node-fetch";

export async function POST(req) {
  try {
    const { images, ribbonText } = await req.json();

    if (!images || images.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 images must be provided" },
        { status: 400 }
      );
    }

    // Fetch image buffers
    const buffers = await Promise.all(
      images.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch image: " + url);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    // Resize all images to 800x800 to ensure uniform fit
    const resized = await Promise.all(
      buffers.map((buf) =>
        sharp(buf)
          .resize(800, 800, { fit: "cover" })
          .toBuffer()
      )
    );

    // Create white background canvas
    const collage = await sharp({
      create: {
        width: 1600,
        height: 1600,
        channels: 3,
        background: "#ffffff"
      }
    })
      .composite([
        { input: resized[0], top: 0, left: 0 },
        { input: resized[1], top: 0, left: 800 },
        { input: resized[2], top: 800, left: 0 },
        { input: resized[3], top: 800, left: 800 }
      ])
      .png()
      .toBuffer();

    return new Response(collage, {
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
