import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req) {
  try {
    const { images, ribbonText } = await req.json();

    if (!images || images.length < 4) {
      return NextResponse.json(
        { error: "Need 4 images" },
        { status: 400 }
      );
    }

    const buffers = images.map((img) =>
      Buffer.from(img.replace(/^data:image\/\w+;base64,/, ""), "base64")
    );

    const processed = await Promise.all(
      buffers.map((b) =>
        sharp(b).resize(800, 800, { fit: "cover" }).toBuffer()
      )
    );

    const base = sharp({
      create: {
        width: 1600,
        height: 1800,
        channels: 3,
        background: "#ffffff",
      },
    });

    const collage = await base
      .composite([
        { input: processed[0], top: 0, left: 0 },
        { input: processed[1], top: 0, left: 800 },
        { input: processed[2], top: 800, left: 0 },
        { input: processed[3], top: 800, left: 800 },
      ])
      .png()
      .toBuffer();

    const ribbon = Buffer.from(
      `<svg width="1600" height="200">
        <rect width="1600" height="200" fill="black"/>
        <text x="50%" y="50%" font-size="60" fill="white" font-family="Arial"
          dominant-baseline="middle" text-anchor="middle">${ribbonText}</text>
      </svg>`
    );

    const final = await sharp(collage)
      .composite([{ input: ribbon, top: 1600, left: 0 }])
      .png()
      .toBuffer();

    return NextResponse.json({
      image: `data:image/png;base64,${final.toString("base64")}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create collage" },
      { status: 500 }
    );
  }
}
