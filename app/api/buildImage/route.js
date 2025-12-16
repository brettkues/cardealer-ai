import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

/* ===== CANVAS / LAYOUT CONSTANTS ===== */
const CANVAS_W = 1200;
const CANVAS_H = 1200;

const RIBBON_H = 212;

const CAPTION_ZONE_H = Math.floor(RIBBON_H * 0.3); // 30%
const DISCLOSURE_H = Math.floor(RIBBON_H * 0.1);   // 10%
const LOGO_ZONE_H = RIBBON_H - CAPTION_ZONE_H - DISCLOSURE_H; // 60%

/* ===== UTIL ===== */
async function fetchImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Image fetch failed");
  return Buffer.from(await res.arrayBuffer());
}

/* ===== MAIN ===== */
export async function POST(req) {
  try {
    const { images, logos = [], captionImage } = await req.json();

    if (!images || images.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 images required" },
        { status: 400 }
      );
    }

    /* ===== BUILD BASE GRID ===== */
    const tileSize = CANVAS_W / 2;

    const tiles = await Promise.all(
      images.map(async (src) =>
        sharp(await fetchImage(src))
          .resize(tileSize, tileSize, { fit: "cover" })
          .toBuffer()
      )
    );

    let base = sharp({
      create: {
        width: CANVAS_W,
        height: CANVAS_H,
        channels: 4,
        background: "#ffffff",
      },
    });

    base = base.composite([
      { input: tiles[0], top: 0, left: 0 },
      { input: tiles[1], top: 0, left: tileSize },
      { input: tiles[2], top: tileSize, left: 0 },
      { input: tiles[3], top: tileSize, left: tileSize },
    ]);

    /* ===== RIBBON BACKGROUND ===== */
    const ribbon = await sharp({
      create: {
        width: CANVAS_W,
        height: RIBBON_H,
        channels: 4,
        background: "#000000",
      },
    }).toBuffer();

    base = base.composite([
      {
        input: ribbon,
        top: CANVAS_H - RIBBON_H,
        left: 0,
      },
    ]);

    /* ===== CAPTION IMAGE (PNG FROM CLIENT) ===== */
    if (captionImage) {
      const captionBuffer = Buffer.from(
        captionImage.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      base = base.composite([
        {
          input: captionBuffer,
          top: CANVAS_H - RIBBON_H,
          left: 0,
        },
      ]);
    }

    /* ===== LOGOS (AUTO-SCALE, CENTERED) ===== */
    if (logos.length > 0) {
      const logoBuffers = await Promise.all(
        logos.map(async (url) => {
          const buf = await fetchImage(url);
          const meta = await sharp(buf).metadata();

          const scale = Math.min(
            (CANVAS_W * 0.9) / meta.width,
            (LOGO_ZONE_H * 0.9) / meta.height,
            1
          );

          const w = Math.round(meta.width * scale);
          const h = Math.round(meta.height * scale);

          return {
            buffer: await sharp(buf).resize(w, h).toBuffer(),
            width: w,
            height: h,
          };
        })
      );

      const totalLogoWidth =
        logoBuffers.reduce((sum, l) => sum + l.width, 0) +
        (logoBuffers.length - 1) * 20;

      let x =
        Math.floor((CANVAS_W - totalLogoWidth) / 2);

      const logoTop =
        CANVAS_H -
        RIBBON_H +
        CAPTION_ZONE_H +
        Math.floor((LOGO_ZONE_H - logoBuffers[0].height) / 2);

      const logoComposites = logoBuffers.map((l) => {
        const entry = {
          input: l.buffer,
          top: logoTop,
          left: x,
        };
        x += l.width + 20;
        return entry;
      });

      base = base.composite(logoComposites);
    }

    /* ===== FINAL OUTPUT ===== */
    const output = await base.png().toBuffer();

    return NextResponse.json({
      output: `data:image/png;base64,${output.toString("base64")}`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Image build failed" },
      { status: 500 }
    );
  }
}
