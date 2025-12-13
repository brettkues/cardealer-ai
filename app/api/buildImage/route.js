import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

const CANVAS = 850;
const IMG_W = 425;
const IMG_H = 319;
const BANNER_H = 212;

async function loadImageBuffer(src) {
  // BASE64 IMAGE
  if (src.startsWith("data:image")) {
    const base64 = src.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64, "base64");
  }

  // URL IMAGE
  const res = await fetch(src, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "image/*",
    },
  });

  if (!res.ok) throw new Error("Image fetch failed");
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

    // -----------------------------------
    // LOAD & RESIZE UP TO 4 IMAGES
    // -----------------------------------
    const resized = [];

    for (const src of images.slice(0, 4)) {
      try {
        const buf = await loadImageBuffer(src);

        const img = await sharp(buf)
          .resize(IMG_W, IMG_H, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer();

        resized.push(img);
      } catch (e) {
        console.warn("Skipping bad image");
      }
    }

    if (resized.length === 0) {
      return NextResponse.json(
        { error: "No valid images could be processed." },
        { status: 500 }
      );
    }

    // -----------------------------------
    // BASE CANVAS
    // -----------------------------------
    let canvas = sharp({
      create: {
        width: CANVAS,
        height: CANVAS,
        channels: 4,
        background: "#ffffff",
      },
    }).png();

    const comps = [];

    // TOP ROW
    if (resized[0]) comps.push({ input: resized[0], left: 0, top: 0 });
    if (resized[1]) comps.push({ input: resized[1], left: IMG_W, top: 0 });

    // BOTTOM ROW
    const bottomY = IMG_H + BANNER_H;
    if (resized[2]) comps.push({ input: resized[2], left: 0, top: bottomY });
    if (resized[3]) comps.push({ input: resized[3], left: IMG_W, top: bottomY });

    canvas = canvas.composite(comps);

    // -----------------------------------
    // OUTPUT
    // -----------------------------------
    const finalImage = await canvas.png().toBuffer();

    return NextResponse.json({
      images: [`data:image/png;base64,${finalImage.toString(]()
