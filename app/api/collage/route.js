import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const { images, ribbonText } = await req.json();

    if (!images || images.length !== 4) {
      return NextResponse.json({ error: "Four images required" }, { status: 400 });
    }

    // Convert base64 images to buffers
    const buffers = images.map((img) =>
      Buffer.from(img.replace(/^data:image\/\w+;base64,/, ""), "base64")
    );

    // Process each image into 800x800 squares
    const processed = await Promise.all(
      buffers.map((b) =>
        sharp(b).resize(800, 800, { fit: "cover" }).toBuffer()
      )
    );

    // Combine into a 1600x1600 collage
    const collage = sharp({
      create: {
        width: 1600,
        height: 1600,
        channels: 3,
        background: "#ffffff",
      },
    })
      .composite([
        { input: processed[0], top: 0, left: 0 },
        { input: processed[1], top: 0, left: 800 },
        { input: processed[2], top: 800, left: 0 },
        { input: processed[3], top: 800, left: 800 },
      ])
      .png();

    const collageBuffer = await collage.toBuffer();

    // Ribbon creation (simple for now)
    const ribbon = await sharp({
      create: {
        width: 1600,
        height: 160,
        channels: 3,
        background: "#000000",
      },
    })
      .composite([])
      .png()
      .toBuffer();

    const final = await sharp(collageBuffer)
      .composite([
        { input: ribbon, top: 720, left: 0 },
        {
          input: Buffer.from(
            `<svg width="1600" height="160">
                <text x="50%" y="50%" font-size="48" fill="white" dominant-baseline="middle" text-anchor="middle">
                  ${ribbonText}
                </text>
              </svg>`
          ),
          top: 720,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    const base64 = `data:image/png;base64,${final.toString("base64")}`;

    return NextResponse.json({ image: base64 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to generate collage" }, { status: 500 });
  }
}
