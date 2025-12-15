import { NextResponse } from "next/server";
import sharp from "sharp";
import { createCanvas } from "@napi-rs/canvas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ---------- seasonal ribbon ---------- */
function getRibbonColor() {
  const m = new Date().getMonth() + 1;
  if (m <= 2 || m === 12) return "#5CA8FF"; // Winter
  if (m <= 5) return "#65C67A";            // Spring
  if (m <= 8) return "#1B4B9B";            // Summer
  return "#D46A1E";                        // Fall
}

/* ---------- render ribbon + text as pixels ---------- */
function renderRibbonWithText(text, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ribbon background
  ctx.fillStyle = getRibbonColor();
  ctx.fillRect(0, 0, width, height);

  // text
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 38px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2, width - 40);

  return canvas.toBuffer("image/png");
}

/* ---------- handler ---------- */
export async function POST(req) {
  try {
    let { images, caption } = await req.json();

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided." },
        { status: 400 }
      );
    }

    while (images.length < 4) images.push(images[0]);
    images = images.slice(0, 4);

    const canvasSize = 850;
    const imgW = 425;
    const imgH = 319;
    const ribbonH = 212;

    const base = sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: "#ffffff",
      },
    });

    const buffers = await Promise.all(
      images.map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Image fetch failed");
        const arr = await res.arrayBuffer();
        return sharp(Buffer.from(arr))
          .resize(imgW, imgH, { fit: "cover" })
          .toBuffer();
      })
    );

    const layers = [
      { input: buffers[0], left: 0,    top: 0 },
      { input: buffers[1], left: imgW, top: 0 },
      { input: buffers[2], left: 0,    top: canvasSize - imgH },
      { input: buffers[3], left: imgW, top: canvasSize - imgH },
    ];

    if (caption) {
      const ribbonPNG = renderRibbonWithText(
        caption,
        canvasSize,
        ribbonH
      );

      layers.push({
        input: ribbonPNG,
        left: 0,
        top: imgH,
      });
    }

    const final = await base
      .composite(layers)
      .png()
      .toBuffer();

    return NextResponse.json({
      output: `data:image/png;base64,${final.toString("base64")}`,
    });
  } catch (err) {
    console.error("BUILD ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
