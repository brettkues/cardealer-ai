import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { images } = await req.json();

    if (!images || images.length < 2) {
      return NextResponse.json(
        { error: "At least 2 images are required." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FETCH IMAGES
    // --------------------------------------------------
    const buffers = [];

    for (const imgUrl of images.slice(0, 4)) {
      try {
        const res = await fetch(imgUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "image/*",
          },
        });

        if (!res.ok) continue;
        buffers.push(Buffer.from(await res.arrayBuffer()));
      } catch {
        // skip failures
      }
    }

    if (buffers.length === 0) {
      return NextResponse.json(
        { error: "Unable to load images." },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // IMAGE SIZES
    // --------------------------------------------------
    const IMG_W = 425;
    const IMG_H = 319;
    const BANNER_H = 212;

    const resized = [];

    for (const buf of buffers) {
      resized.push(
        await sharp(buf)
          .resize(IMG_W, IMG_H, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer()
      );
    }

    // --------------------------------------------------
    // BASE CANVAS
    // --------------------------------------------------
    let canvas = sharp({
      create: {
        width: 850,
        height: 850,
        channels: 4,
        background: "#ffffff",
      },
    }).png();

    const composites = [];

    // TOP ROW
    if (resized[0]) composites.push({ input: resized[0], left: 0, top: 0 });
    if (resized[1]) composites.push({ input: resized[1], left: 425, top: 0 });

    // BOTTOM ROW
    const bottomY = IMG_H + BANNER_H;
    if (resized[2]) composites.push({ input: resized[2], left: 0, top: bottomY });
    if (resized[3]) composites.push({ input: resized[3], left: 425, top: bottomY });

    canvas = canvas.composite(composites);

    // --------------------------------------------------
    // OUTPUT
    // --------------------------------------------------
    const finalImage = await canvas.png().toBuffer();

    return NextResponse.json({
      images: [`data:image/png;base64,${finalImage.toString("base64")}`],
    });
  } catch (err) {
    console.error("BUILD IMAGE ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
