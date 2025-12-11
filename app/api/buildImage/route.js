export const runtime = "nodejs"; // Required for canvas on Vercel

import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const {
      images,
      ribbonText,
      disclosure,
      logos,
      ymm
    } = await req.json();

    if (!images || images.length < 1) {
      return NextResponse.json({ error: "No images received" }, { status: 400 });
    }

    // Canvas = 850 x 850
    const canvas = createCanvas(850, 850);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 850, 850);

    // Load images
    const loaded = await Promise.all(
      images.map(src => loadImage(src).catch(() => null))
    );

    const valid = loaded.filter(Boolean).slice(0, 4);

    // Layout positions
    const positions = [
      [0, 0],         // top-left
      [425, 0],       // top-right
      [0, 425],       // bottom-left
      [425, 425]      // bottom-right
    ];

    valid.forEach((img, i) => {
      const [x, y] = positions[i];
      ctx.drawImage(img, x, y, 425, 425);
    });

    // Ribbon bar
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 390, 850, 70);

    // Ribbon text
    ctx.font = "28px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(ribbonText || ymm || "", 425, 432);

    // Disclosure
    if (disclosure) {
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.fillText(disclosure, 10, 840);
    }

    // Logos
    if (logos && Array.isArray(logos)) {
      let offsetX = 20;

      for (let file of logos.slice(0, 3)) {
        try {
          const logoImg = await loadImage(file);
          const size = 70;
          ctx.drawImage(logoImg, offsetX, 10, size, size);
          offsetX += size + 20;
        } catch {}
      }
    }

    const jpg = canvas.toBuffer("image/jpeg", { quality: 0.9 });

    return new NextResponse(jpg, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg"
      }
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Image builder failed", details: err.message },
      { status: 500 }
    );
  }
}
