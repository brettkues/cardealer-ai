import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const CANVAS = 850;
const IMG_W = 425;
const IMG_H = 319;
const BANNER_H = 212;

/**
 * Load image from URL or base64
 */
async function loadImageBuffer(src) {
  // Base64 image
  if (src.startsWith("data:image")) {
    const base64 = src.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64, "base64");
  }

  // Remote image
  const res = await fetch(src, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "image/*",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch image");
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req) {
  try {
    const { images } = await req.json();

    if (!images || images.length < 2) {
      return NextResponse.json(
        { error: "At least 2 images required." },
        { status: 400 }
      );
    }

    // -----------------------------
    // LOAD & RESIZE IMAGES
    // -----------------------------
    const resizedImages = [];

    for (const src of images.slice(0, 4)) {
      try {
        const buffer = await loadImageBuffer(src);

        const resized = await sharp(buffer)
          .resize(IMG_W, IMG_H, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer();

        resizedImages.push(resized);
      } catch {
        // Skip invalid images
      }
    }

    if (resizedImages.length === 0) {
      return NextResponse.json(
        { error: "No valid images processed." },
        { status: 500 }
      );
    }

    // -----------------------------
    // BASE CANVAS
    // -----------------------------
    let canvas = sharp({
      create: {
        width: CANVAS,
        height: CANVAS,
        channels: 4,
        background: "#ffffff",
      },
    }).png();

    const composites = [];

    // Top row
    if (resizedImages[0])
      composites.push({ input: resizedImages[0], left: 0, top: 0 });
    if (resizedImages[1])
      composites.push({ input: resizedImages[1], left: IMG_W, top: 0 });

    // Bottom row
    const bottomY = IMG_H + BANNER_H;
    if (resizedImages[2])
      composites.push({ input: resizedImages[2], left: 0, top: bottomY });
    if (resizedImages[3])
      composites.push({ input: resizedImages[3], left: IMG_W, top: bottomY });

    canvas = canvas.composite(composites);

    // -----------------------------
    // OUTPUT
    // -----------------------------
    const finalImage = await canvas.png().toBuffer();

    return NextResponse.json({
      images: [
        `data:image/png;base64,${finalImage.toString("base64")}`,
      ],
    });
  } catch (err) {
    console.error("BUILD IMAGE ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
