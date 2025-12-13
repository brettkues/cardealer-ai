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
    const { images, caption } = await req.json();

    if (!images || images.length < 4) {
      return NextResponse.json(
        { error: "Exactly 4 images required." },
        { status: 400 }
      );
    }

    // CANVAS
    const canvasSize = 850;
    const imageWidth = 425;
    const imageHeight = 319;
    const ribbonHeight = 212;

    const canvas = sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: "#ffffff",
      },
    });

    // LOAD + RESIZE IMAGES
    const buffers = await Promise.all(
      images.slice(0, 4).map(async (url) => {
        const res = await fetch(url);
        const arr = await res.arrayBuffer();
        return sharp(Buffer.from(arr))
          .resize(imageWidth, imageHeight, { fit: "cover" })
          .toBuffer();
      })
    );

    // POSITIONS
    const composites = [
      { input: buffers[0], left: 0, top: 0 },
      { input: buffers[1], left: imageWidth, top: 0 },
      { input: buffers[2], left: 0, top: canvasSize - imageHeight },
      { input: buffers[3], left: imageWidth, top: canvasSize - imageHeight },
    ];

    // RIBBON
    const ribbon = await sharp({
      create: {
        width: canvasSize,
        height: ribbonHeight,
        channels: 4,
        background: getRibbonColor(),
      },
    })
      .png()
      .toBuffer();

    composites.push({
      input: ribbon,
      left: 0,
      top: imageHeight,
    });

    // CAPTION
    if (caption) {
      const svg = `
        <svg width="${canvasSize}" height="${ribbonHeight}">
          <text
            x="50%"
            y="50%"
            text-anchor="middle"
            alignment-baseline="central"
            font-size="38"
            fill="white"
            font-family="Arial, Helvetica, sans-serif"
          >
            ${caption.replace(/&/g, "&amp;")}
          </text>
        </svg>
      `;

      composites.push({
        input: Buffer.from(svg),
        left: 0,
        top: imageHeight,
      });
    }

    const final = await canvas.composite(composites).png().toBuffer();

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
