import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

// Seasonal ribbon color logic
function getSeasonalRibbonColor() {
  const month = new Date().getMonth() + 1;

  if (month === 12 || month <= 2) return "#5CA8FF"; // Winter – Icy Blue
  if (month >= 3 && month <= 5) return "#65C67A";   // Spring – Fresh Green
  if (month >= 6 && month <= 8) return "#1B4B9B";   // Summer – Deep Blue
  return "#D46A1E";                                 // Fall – Burnt Orange
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

    // Use the first vehicle image
    const mainImageURL = images[0];
    const mainImageBuffer = await fetch(mainImageURL).then((r) => r.arrayBuffer());
    const mainJPG = Buffer.from(mainImageBuffer);

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

    // Ribbon bar
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

    // ---------------------------
    // LOGOS (LEFT SIDE)
    // ---------------------------
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

    // ---------------------------
    // CAPTION (CENTERED)
    // ---------------------------
    const safeCaption = caption ? caption.replace(/&/g, "&amp;") : "";

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

    // Final image
    const finalImage = await canvas.png().toBuffer();
    const base64Image = `data:image/png;base64,${finalImage.toString("base64")}`;

    // 🔑 CRITICAL FIX: return an ARRAY
    return NextResponse.json({
      images: [base64Image],
    });
  } catch (err) {
    console.error("BUILD ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
