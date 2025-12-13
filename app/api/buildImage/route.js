import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { images } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // DOWNLOAD UP TO 4 IMAGES (OWN THE BYTES)
    // --------------------------------------------------
    const imageBuffers = [];

    for (const imgUrl of images.slice(0, 4)) {
      try {
        const res = await fetch(imgUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "image/*",
          },
        });

        if (!res.ok) continue;

        const buffer = Buffer.from(await res.arrayBuffer());

        const resized = await sharp(buffer)
          .resize(425, 425, { fit: "cover", position: "center" })
          .png()
          .toBuffer();

        imageBuffers.push(resized);
      } catch {
        // skip failed images
      }
    }

    if (imageBuffers.length === 0) {
      return NextResponse.json(
        { error: "Unable to process vehicle images." },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // BASE 850x850 CANVAS
    // --------------------------------------------------
    let canvas = sharp({
      create: {
        width: 850,
        height: 850,
        channels: 4,
        background: "#ffffff",
      },
    }).png();

    const positions = [
      { left: 0, top: 0 },       // top-left
      { left: 425, top: 0 },     // top-right
      { left: 0, top: 425 },     // bottom-left
      { left: 425, top: 425 },   // bottom-right
    ];

    const composites = imageBuffers.map((img, i) => ({
      input: img,
      left: positions[i].left,
      top: positions[i].top,
    }));

    canvas = canvas.composite(composites);

    // --------------------------------------------------
    // FINAL OUTPUT
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
