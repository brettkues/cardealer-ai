import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

function getRibbonColor() {
  const m = new Date().getMonth() + 1;
  if (m <= 2 || m === 12) return "#5CA8FF"; // Winter
  if (m <= 5) return "#65C67A";             // Spring
  if (m <= 8) return "#1B4B9B";             // Summer
  return "#D46A1E";                         // Fall
}

export async function POST(req) {
  try {
    let { images, caption } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided." },
        { status: 400 }
      );
    }

    // ✅ GUARANTEE 4 IMAGES
    while (images.length < 4) {
      images.push(images[0]);
    }
    images = images.slice(0, 4);

    // CANVAS SETUP
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

    // LOAD + RESIZE
    const buffers = await Promise.all(
      images.map(async (url) => {
        const res = await fetch(url);
        const arr = await res.arrayBuffer();
        return sharp(Buffer.from(arr))
          .resize(imgW, imgH, { fit: "cover" })
          .toBuffer();
      })
    );

    const layers = [
      { input: buffers[0], left: 0,      top: 0 },
      { input: buffers[1], left: imgW,   top: 0 },
      { input: buffers[2], left: 0,      top: canvasSize - imgH },
      { input: buffers[3], left: imgW,   top: canvasSize - imgH },
    ];

    // RIBBON
    const ribbon = await sharp({
      create: {
        width: canvasSize,
        height: ribbonH,
        channels: 4,
        background: getRibbonColor(),
      },
    }).png().toBuffer();

    layers.push({
      input: ribbon,
      left: 0,
      top: imgH,
    });

    // CAPTION
    if (caption) {
      const safe = caption.replace(/&/g, "&amp;");
      const svg = `
        <svg width="${canvasSize}" height="${ribbonH}">
          <text
            x="50%"
            y="50%"
            text-anchor="middle"
            alignment-baseline="central"
            font-size="38"
            fill="white"
            font-family="Arial, Helvetica, sans-serif"
          >
            ${safe}
          </text>
        </svg>
      `;

      layers.push({
        input: Buffer.from(svg),
        left: 0,
        top: imgH,
      });
    }

    const final = await base.composite(layers).png().toBuffer();

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
