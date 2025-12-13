import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

// Seasonal ribbon color logic
function getSeasonalRibbonColor() {
  const month = new Date().getMonth() + 1;

  if (month === 12 || month <= 2) return "#5CA8FF"; // Winter
  if (month >= 3 && month <= 5) return "#65C67A";  // Spring
  if (month >= 6 && month <= 8) return "#1B4B9B";  // Summer
  return "#D46A1E";                                // Fall
}

export async function POST(req) {
  try {
    const { images, caption, logos } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No vehicle images found." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // FETCH VEHICLE IMAGE (WITH HEADERS – CRITICAL FIX)
    // --------------------------------------------------
    const mainImageURL = images[0];

    const imageRes = await fetch(mainImageURL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "image/*",
        "Referer": mainImageURL,
      },
    });

    if (!imageRes.ok) {
      throw new Error(`Failed to fetch image: ${imageRes.status}`);
    }

    const mainImageBuffer = await imageRes.arrayBuffer();
    const mainJPG = Buffer.from(mainImageBuffer);

    // --------------------------------------------------
    // CANVAS SETUP
    // --------------------------------------------------
    const canvasSize = 850;
    const mainWidth = 820;
    const mainHeight = 600;
    const ribbonHeight = 150;
    const ribbonColor = getSeasonalRibbonColor();

    // Resize main image
    const resizedMain = await sharp(mainJPG)
      .resize(mainWidth, mainHeight, { fit: "cover" })
      .toBuffer();

    // Base canvas
    let canvas = sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: "#ffffff",
      },
    }).png();

    // Composite main image
    canvas = canvas.composite([
      {
        input: resizedMain,
        top: 10,
        left: 15,
      },
    ]);

    // --------------------------------------------------
    // RIBBON
    // --------------------------------------------------
    const ribbon = await sharp({
      create: {
        width: canvasSize,
        height: ribbonHeight,
        channels: 4,
        background: ribbonColor,
      },
    })
      .png()
      .toBuffer();

    canvas = canvas.composite([
      { input: ribbon, top: canvasSize - ribbonHeight, left: 0 },
    ]);

    // --------------------------------------------------
    // LOGOS (LEFT SIDE, UP TO 3)
    // --------------------------------------------------
    const logoStartY = canvasSize - ribbonHeight + 15;
    let currentY = logoStartY;
    const logoSize = 70;

    for (const logo of (logos || []).slice(0, 3)) {
      try {
        const base64 = logo.url.replace(/^data:image\/\w+;base64,/, "");
        const buf = Buffer.from(base64, "base64");

        const resizedLogo = await sharp(buf)
          .resize(logoSize, logoSize, { fit: "contain" })
          .toBuffer();

        canvas = canvas.composite([
          { input: resizedLogo, top: currentY, left: 20 },
        ]);

        currentY += logoSize + 10;
      } catch {
        // ignore bad logos
      }
    }

    // --------------------------------------------------
    // CAPTION (CENTERED)
    // --------------------------------------------------
    const safeCaption = caption
      ? caption.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      : "";

    const svgCaption = `
      <svg width="${canvasSize}" height="${ribbonHeight}">
        <text
          x="50%"
          y="50%"
          font-size="38"
          fill="white"
          font-family="Arial, Helvetica, sans-serif"
          text-anchor="middle"
          alignment-baseline="central"
        >
          ${safeCaption}
        </text>
      </svg>
    `;

    const captionBuffer = Buffer.from(svgCaption);

    canvas = canvas.composite([
      {
        input: captionBuffer,
        top: canvasSize - ribbonHeight,
        left: 0,
      },
    ]);

    // --------------------------------------------------
    // FINAL IMAGE
    // --------------------------------------------------
    const finalImage = await canvas.png().toBuffer();

    return NextResponse.json({
      images: [`data:image/png;base64,${finalImage.toString("base64")}`],
    });
  } catch (err) {
    console.error("BUILD IMAGE ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
