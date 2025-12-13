import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { images } = await req.json();

    if (!Array.isArray(images) || images.length < 4) {
      return NextResponse.json(
        { error: "Exactly 4 vehicle images are required." },
        { status: 400 }
      );
    }

    // -----------------------------------
    // CONSTANTS
    // -----------------------------------
    const CANVAS_SIZE = 850;
    const TILE_WIDTH = 425;
    const TILE_HEIGHT = 319;
    const RIBBON_HEIGHT = 212;

    // -----------------------------------
    // FETCH & RESIZE 4 IMAGES
    // -----------------------------------
    const processedImages = await Promise.all(
      images.slice(0, 4).map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Image fetch failed");

        const buffer = Buffer.from(await res.arrayBuffer());

        return sharp(buffer)
          .resize(TILE_WIDTH, TILE_HEIGHT, { fit: "cover" })
          .toBuffer();
      })
    );

    // -----------------------------------
    // BASE CANVAS
    // -----------------------------------
    let canvas = sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 4,
        background: "#ffffff",
      },
    });

    // -----------------------------------
    // COMPOSITE LAYOUT
    // -----------------------------------
    canvas = canvas.composite([
      // Top row
      { input: processedImages[0], left: 0, top: 0 },
      { input: processedImages[1], left: TILE_WIDTH, top: 0 },

      // Bottom row
      { input: processedImages[2], left: 0, top: TILE_HEIGHT + RIBBON_HEIGHT },
      {
        input: processedImages[3],
        left: TILE_WIDTH,
        top: TILE_HEIGHT + RIBBON_HEIGHT,
      },
    ]);

    // -----------------------------------
    // OUTPUT
    // -----------------------------------
    const finalImage = await canvas.png().toBuffer();

    return NextResponse.json({
      images: [`data:image/png;base64,${finalImage.toString("base64")}`],
    });
  } catch (err) {
    console.error("IMAGE BUILD ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
