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

async function fetchAsBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed");
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

export async function POST(req) {
  try {
    const { images, caption, logos = [] } = await req.json();

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided." }, { status: 400 });
    }

    // Ensure exactly 4 images
    const imgs = [...images];
    while (imgs.length < 4) imgs.push(imgs[0]);
    const four = imgs.slice(0, 4);

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

    // Vehicle images
    const buffers = await Promise.all(
      four.map(async (url) => {
        const buf = await fetchAsBuffer(url);
        return sharp(buf).resize(imgW, imgH, { fit: "cover" }).toBuffer();
      })
    );

    const layers = [
      { input: buffers[0], left: 0,    top: 0 },
      { input: buffers[1], left: imgW, top: 0 },
      { input: buffers[2], left: 0,    top: canvasSize - imgH },
      { input: buffers[3], left: imgW, top: canvasSize - imgH },
    ];

    // Ribbon
    const ribbon = await sharp({
      create: {
        width: canvasSize,
        height: ribbonH,
        channels: 4,
        background: getRibbonColor(),
      },
    }).png().toBuffer();

    layers.push({ input: ribbon, left: 0, top: imgH });

    // Caption (SVG, safe text)
    if (caption) {
      const safe = caption
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const svg = `
        <svg width="${canvasSize}" height="${ribbonH}">
          <text
            x="50%"
            y="50%"
            text-anchor="middle"
            alignment-baseline="central"
            font-size="38"
            fill="#ffffff"
            font-family="Arial, Helvetica, sans-serif"
          >${safe}</text>
        </svg>
      `;

      layers.push({ input: Buffer.from(svg), left: 0, top: imgH });
    }

    // Logos (URLs OR base64 data URLs) — server-side fetch, no CORS
    if (Array.isArray(logos) && logos.length > 0) {
      const max = Math.min(3, logos.length);
      const logoSize = 90;
      const gap = 14;
      const totalW = max * logoSize + (max - 1) * gap;
      let leftStart = Math.round((canvasSize - totalW) / 2);
      const topPos = imgH + ribbonH - logoSize - 18;

      for (let i = 0; i < max; i++) {
        const src = logos[i];
        let logoBuf;

        if (typeof src === "string" && src.startsWith("data:image")) {
          logoBuf = Buffer.from(src.split(",")[1], "base64");
        } else {
          logoBuf = await fetchAsBuffer(src);
        }

        const resized = await sharp(logoBuf)
          .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        layers.push({
          input: resized,
          left: leftStart + i * (logoSize + gap),
          top: topPos,
        });
      }
    }

    const final = await base.composite(layers).png().toBuffer();

    return NextResponse.json({
      output: `data:image/png;base64,${final.toString("base64")}`,
    });
  } catch (err) {
    console.error("BUILD ERROR:", err);
    return NextResponse.json({ error: "Image build failed." }, { status: 500 });
  }
}
