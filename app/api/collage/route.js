export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const { images, ribbonText } = await req.json();

    if (!images || images.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 images must be provided" },
        { status: 400 }
      );
    }

    // Fetch all images as buffers
    const buffers = await Promise.all(
      images.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch image: " + url);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    // Combine the images into a 2x2 grid
    const collage = await sharp({
      create: {
        width: 1600,
        height: 1600,
        channels: 3,
        background: "#ffffff",
      },
    })
      .composite([
        { input: buffers[0], top: 0, left: 0 },
        { input: buffers[1], top: 0, left: 800 },
        { input: buffers[2], top: 800, left: 0 },
        { input: buffers[3], top: 800, left: 800 },
      ])
      .toBuffer();

    // NOTE: RIBBON GENERATION will be added later — this ensures backend stability first.

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
