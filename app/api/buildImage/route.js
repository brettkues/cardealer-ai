import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

async function fetchImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Image fetch failed");
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req) {
  try {
    let {
      images,
      logos = [],
      captionImage,
      disclosureImage,
      ribbonImage
    } = await req.json();

    if (!ribbonImage) {
      throw new Error("Missing ribbonImage");
    }

    while (images.length < 4) images.push(images[0]);
    images = images.slice(0, 4);

    const canvas = 850;
    const imgW = 425;
    const imgH = 319;
    const ribbonH = 212;

    /* ===== LAYOUT ===== */
    const RIBBON_TOP = imgH;
    const CAPTION_Y = RIBBON_TOP;
    const LOGO_TOP = RIBBON_TOP + 64;
    const LOGO_BOTTOM = RIBBON_TOP + 197;
    const DISCLOSURE_Y = RIBBON_TOP + 197;

    const base = sharp({
      create: {
        width: canvas,
        height: canvas,
        channels: 4,
        background: "#ffffff"
      }
    });

    /* ===== VEHICLE IMAGES ===== */
   const vehicleBuffers = await Promise.all(
      images.map(async (url) =>
        sharp(await fetchImage(url))
          .resize(imgW, imgH, { fit: "cover" })
          .toBuffer()
      )
    );

    const layers = [
      { input: vehicleBuffers[0], left: 0, top: 0 },
      { input: vehicleBuffers[1], left: imgW, top: 0 },
      { input: vehicleBuffers[2], left: 0, top: canvas - imgH },
      { input: vehicleBuffers[3], left: imgW, top: canvas - imgH }
    ];

    /* ===== RIBBON (PNG, PRE-RENDERED) ===== */
    const ribbonBuffer = Buffer.from(
      ribbonImage.replace(/^data:image\/png;base64,/, ""),
      "base64"
    );

    layers.push({
      input: ribbonBuffer,
      left: 0,
      top: RIBBON_TOP
    });

    /* ===== CAPTION ===== */
    if (captionImage) {
      const buf = Buffer.from(
        captionImage.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      const resized = await sharp(buf)
        .resize({ width: canvas, height: 64, fit: "inside" })
        .toBuffer();

      const meta = await sharp(resized).metadata();

      layers.push({
        input: resized,
        left: Math.floor((canvas - meta.width) / 2),
        top: CAPTION_Y
      });
    }

    /* ===== LOGOS ===== */
    if (logos.length > 0) {
      const logoBuffers = await Promise.all(logos.map(fetchImage));
      const zoneH = LOGO_BOTTOM - LOGO_TOP;
      const maxH = Math.floor(zoneH * 0.9);
      const spacing = Math.floor(canvas / logos.length);

      for (let i = 0; i < logos.length; i++) {
        const resized = await sharp(logoBuffers[i])
          .resize({ height: maxH, fit: "inside" })
          .toBuffer();

        const meta = await sharp(resized).metadata();

        layers.push({
          input: resized,
          left:
            logos.length === 1
              ? Math.floor((canvas - meta.width) / 2)
              : Math.floor(spacing * i + (spacing - meta.width) / 2),
          top: LOGO_TOP + Math.floor((zoneH - meta.height) / 2)
        });
      }
    }

    /* ===== DISCLOSURE ===== */
    if (disclosureImage) {
      const buf = Buffer.from(
        disclosureImage.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      const resized = await sharp(buf)
        .resize({ width: canvas, height: 15, fit: "inside" })
        .toBuffer();

      const meta = await sharp(resized).metadata();

      layers.push({
        input: resized,
        left: Math.floor((canvas - meta.width) / 2),
        top: DISCLOSURE_Y
      });
    }

    const final = await base.composite(layers).png().toBuffer();

    return NextResponse.json({
      output: `data:image/png;base64,${final.toString("base64")}`
    });

  } catch (err) {
    console.error("BUILD IMAGE ERROR:", err);
      return NextResponse.json(
      { error: err.message || "Image build failed" },
      { status: 500 }
    );
  }
}
