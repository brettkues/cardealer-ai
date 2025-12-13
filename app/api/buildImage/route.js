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

    const imageUrl = images[0];

    // --------------------------------------------------
    // FETCH IMAGE ONCE (OWN THE BYTES)
    // --------------------------------------------------
    const imageRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/*",
      },
    });

    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Failed to download image." },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer());

    // --------------------------------------------------
    // CREATE 850x850 CANVAS
    // --------------------------------------------------
    const finalImage = await sharp(buffer)
      .resize(850, 850, {
        fit: "cover",
        position: "center",
      })
      .png()
      .toBuffer();

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
