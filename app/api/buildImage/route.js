import { NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ---------- guaranteed font ---------- */
const fontPath = path.join(
  process.cwd(),
  "assets/fonts/Inter-SemiBold.ttf"
);
const fontBase64 = fs.readFileSync(fontPath).toString("base64");

/* ---------- seasonal ribbon ---------- */
function getRibbonColor() {
  const m = new Date().getMonth() + 1;
  if (m <= 2 || m === 12) return "#5CA8FF"; // Winter
  if (m <= 5) return "#65C67A";            // Spring
  if (m <= 8) return "#1B4B9B";            // Summer
  return "#D46A1E";                        // Fall
}

/* ---------- helpers ---------- */
function escapeXml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

    /* ensure exactly 4 images */
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

    /* fetch + resize images */
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

    /* ribbon */
    const ribbon = await sharp({
      create: {
        width: canvasSize,
        height: ribbonH,
        channels: 4,
        background: getRibbonColor(),
      },
    })
      .png()
      .toBuffer();

    layers.push({
      input: ribbon,
      left: 0,
      top: imgH,
    });

    /* caption (embedded font) */
    if (caption) {
      const svg = `
<svg width="${canvasSize}" height="${ribbonH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'InterEmbed';
        src: url(data:font/ttf;base64,${fontBase64}) format('truetype');
        font-weight: 600;
      }
      text {
        font-family: 'InterEmbed', sans-serif;
        fill: white;
      }
    </style>
  </defs>

  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-size="38"
  >
    ${escapeXml(caption)}
  </text>
</svg>`;

      layers.push({
        input: Buffer.from(svg),
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
