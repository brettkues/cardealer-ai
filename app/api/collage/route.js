import { NextResponse } from "next/server";
import sharp from "sharp";

/**
 * Combine 4 selected images into an 850x850 collage.
 * Layout: 2 images on top, 2 on bottom.
 */
export async function POST(req) {
  try {
    const { imageUrls, ribbonText } = await req.json();

    if (!imageUrls || imageUrls.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 images are required." },
        { status: 400 }
      );
    }

    // Fetch all 4 images
    const buffers = await Promise.all(
      imageUrls.map(async (url) => {
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    // Resize each image to 425x425 (half of 850x850)
    const resized = await Promise.all(
      buffers.map((img) =>
        sharp(img).resize(425, 425, { fit: "cover" }).toBuffer()
      )
    );

    // Create a blank 850x850 background
    let collage = sharp({
      create: {
        width: 850,
        height: 850,
        channels: 3,
        background: "#ffffff"
      }
    }).composite([
      // Top-left
      { input: resized[0], left: 0, top: 0 },

      // Top-right
      { input: resized[1], left: 425, top: 0 },

      // Bottom-left
      { input: resized[2], left: 0, top: 425 },

      // Bottom-right
      { input: resized[3], left: 425, top: 425 }
    ]);

    // Final image buffer
    const output = await collage.jpeg({ quality: 90 }).toBuffer();

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg"
      }
    });

  } catch (error) {
    console.error("Collage API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate collage." },
      { status: 500 }
    );
  }
}
