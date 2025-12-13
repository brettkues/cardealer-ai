import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

// ----------------------------------------
// Seasonal banner color
// ----------------------------------------
function getSeasonalRibbonColor() {
  const m = new Date().getMonth() + 1;
  if (m === 12 || m <= 2) return "#5CA8FF";
  if (m >= 3 && m <= 5) return "#65C67A";
  if (m >= 6 && m <= 8) return "#1B4B9B";
  return "#D46A1E";
}

export async function POST(req) {
  try {
    const { images, caption = "", logos = [] } = await req.json();

    if (!images || images.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 images are required." },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Layout constants
    // ----------------------------------------
    const CANVAS = 850;
    const IMG_W = 425;
    const IMG_H = 319;
    const BANNER_H = 212;
    const BANNER_TOP = IMG_H;
    const BOTTOM_TOP = IMG_H + BANNER_H;

    // ----------------------------------------
    // Base canvas
    // ----------------------------------------
    let canvas = sharp({
      create: {
        width: CANVAS,
        height: CANVAS,
        channels: 4,
        background: "#ffffff",
      },
    });

    // ----------------------------------------
    // Decode + resize images (BASE64 ONLY)
    // ----------------------------------------
    const resized = [];

    for (const img64 of images) {
      const base64 = img64.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(base64, "base64");

      const out = await sharp(buf)
        .resize(IMG_W, IMG_H, { fit: "cover" })
        .toBuffer();

      resized.push(out);
    }

    // ----------------------------------------
    // Composite vehicle images
    // ----------------------------------------
    canvas = canvas.composite([
      { input: resized[0], top: 0, left: 0 },
      { input: resized[1], top: 0, left: IMG_W },
      { input: resized[2], top: BOTTOM_TOP, left: 0 },
      { input: resized[3], top: BOTTOM_TOP, left: IMG_W },
    ]);

    // ----------------------------------------
    // Banner
    // ----------------------------------------
    const banner = await sharp({
      create: {
        width: CANVAS,
        height: BANNER_H,
        channels: 4,
        background: getSeasonalRibbonColor(),
      },
    })
      .png()
      .toBuffer();

    canvas = canvas.composite([{ input: banner, top: BANNER_TOP, left: 0 }]);

    // ----------------------------------------
    // Caption
    // ----------------------------------------
    if (caption) {
      const safe = caption.replace(/&/g, "&amp;");

      const svg = `
        <svg width="${CANVAS}" height="${BANNER_H}">
          <text
            x="50%"
            y="50%"
            font-size="38"
            fill="white"
            font-family="Arial, Helvetica, sans-serif"
            text-anchor="middle"
            alignment-baseline="central"
          >
            ${safe}
          </text>
        </svg>
      `;

      canvas = canvas.composite([
        { input: Buffer.from(svg), top: BANNER_TOP, left: 0 },
      ]);
    }

    // ----------------------------------------
    // Logos (left stack)
    // ----------------------------------------
    let y = BANNER_TOP + 15;
    const LOGO = 70;

    for (const l of logos.slice(0, 3)) {
      try {
        const b64 = l.url.replace(/^data:image\/\w+;base64,/, "");
        const buf = Buffer.from(b64, "base64");

        const out = await sharp(buf)
          .resize(LOGO, LOGO, { fit: "contain" })
          .toBuffer();

        canvas = canvas.composite([{ input: out, top: y, left: 20 }]);
        y += LOGO + 10;
      } catch {}
    }

    // ----------------------------------------
    // Output
    // ----------------------------------------
    const final = await canvas.png().toBuffer();

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
