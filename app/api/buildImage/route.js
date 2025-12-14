import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";

export async function POST(req) {
  try {
    const body = await req.json();
    const { selectedImages, caption } = body;

    // ---- Validation ----
    if (!Array.isArray(selectedImages)) {
      return NextResponse.json(
        { error: "selectedImages must be an array" },
        { status: 400 }
      );
    }

    if (selectedImages.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 images are required" },
        { status: 400 }
      );
    }

    // ---- Canvas setup ----
    const WIDTH = 1200;
    const HEIGHT = 1200;
    const HALF = WIDTH / 2;

    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ---- Load images ----
    const images = await Promise.all(
      selectedImages.map((src) => loadImage(src))
    );

    // ---- Draw images (order matters) ----
    ctx.drawImage(images[0], 0, 0, HALF, HALF);
    ctx.drawImage(images[1], HALF, 0, HALF, HALF);
    ctx.drawImage(images[2], 0, HALF, HALF, HALF);
    ctx.drawImage(images[3], HALF, HALF, HALF, HALF);

    // ---- Caption overlay ----
    if (caption) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, HEIGHT - 90, WIDTH, 90);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(caption, WIDTH / 2, HEIGHT - 45, WIDTH - 40);
    }

    // ---- Return image ----
    const buffer = canvas.toBuffer("image/png");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    console.error("buildImage error:", err);
    return NextResponse.json(
      { error: "Image build failed" },
      { status: 500 }
    );
  }
}
