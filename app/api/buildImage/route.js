import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

// --------------------------------------------------
// Seasonal ribbon color
// --------------------------------------------------
function getSeasonalRibbonColor() {
  const month = new Date().getMonth() + 1;
  if (month === 12 || month <= 2) return "#5CA8FF";
  if (month >= 3 && month <= 5) return "#65C67A";
  if (month >= 6 && month <= 8) return "#1B4B9B";
  return "#D46A1E";
}

export async function POST(req) {
  try {
    const { images, caption = "", logos = [] } = await req.json();

    if (!images || images.length < 4) {
      return NextResponse.json(
        { error: "Four vehicle images are required." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // CONSTANTS
    // --------------------------------------------------
    const CANVAS_SIZE = 850;
    const IMAGE_WIDTH = 425;
    const IMAGE_HEIGHT = 319;
    const BANNER_HEIGHT = 212;
    const BANNER_TOP = IMAGE_HEIGHT;
    const BOTTOM_ROW_TOP = IMAGE_HEIGHT + BANNER_HEIGHT;

    // --------------------------------------------------
    // BASE CANVAS
    // --------------------------------------------------
    let canvas = sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 4,
        background: "#ffffff",
      },
    });

    // --------------------------------------------------
    // FETCH + RESIZE IMAGES (WITH HEADERS)
    // --------------------------------------------------
    const resizedImages = [];

    for (let i = 0; i < 4; i++) {
      try {
        const res = await fetch(images[i], {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            Accept: "image/*",
          },
        });

        if (!res.ok) throw new Error("Image fetch failed");

        const buffer = await res.arrayBuffer();

        const img = await sharp(Buffer.from(buffer))
          .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: "cover" })
          .toBuffer();

        resizedImages.push(img);
      } catch (err) {
        console.error("IMAGE LOAD FAILED:", images[i]);
        return NextResponse.json(
          { error: "Failed to load vehicle image." },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------
    // COMPOSITE VEHICLE IMAGES
    // --------------------------------------------------
    canvas = canvas.composite([
      { input: resizedImages[0], top: 0, left: 0 },
      { input: resizedImages[1], top: 0, left: IMAGE_WIDTH },
      { input: resizedImages[2], top: BOTTOM_ROW_TOP, left: 0 },
      { input: resizedImages[3], top: BOTTOM_ROW_TOP, left: IMAGE_WIDTH },
    ]);

    // --------------------------------------------------
    // BANNER
    // --------------------------------------------------
    const banner = await sharp({
      create: {
        width: CANVAS_SIZE,
        height: BANNER_HEIGHT,
        channels: 4,
        background: getSeasonalRibbonColor(),
      },
    })
      .png()
      .toBuffer();

    canvas = canvas.composite([{ input: banner, top: BANNER_TOP, left: 0 }]);

    // --------------------------------------------------
    // CAPTION
    // --------------------------------------------------
    if (caption) {
      const safeCaption = caption.replace(/&/g, "&amp;");

      const captionSVG = `
        <svg width="${CANVAS_SIZE}" height="${BANNER_HEIGHT}">
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

      canvas = canvas.composite([
        { input: Buffer.from(captionSVG), top: BANNER_TOP, left: 0 },
      ]);
    }

    // --------------------------------------------------
    // LOGOS
    // --------------------------------------------------
    let logoY = BANNER_TOP + 15;
    const LOGO_SIZE = 70;

    for (const logo of logos.slice(0, 3)) {
      try {
        const base64 = logo.url.replace(/^data:image\/\w+;base64,/, "");
        const buf = Buffer.from(base64, "base64");

        const resizedLogo = await sharp(buf)
          .resize(LOGO_SIZE, LOGO_SIZE, { fit: "contain" })
          .toBuffer();

        canvas = canvas.composite([
          { input: resizedLogo, top: logoY, left: 20 },
        ]);

        logoY += LOGO_SIZE + 10;
      } catch {}
    }

    // --------------------------------------------------
    // OUTPUT
    // --------------------------------------------------
    const finalImage = await canvas.png().toBuffer();

    return NextResponse.json({
      output: `data:image/png;base64,${finalImage.toString("base64")}`,
    });
  } catch (err) {
    console.error("BUILD ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
