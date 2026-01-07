import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchImage(url) {
  // Handle base64 data URLs
  if (url.startsWith("data:image")) {
    return Buffer.from(
      url.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
  }

  const res = await fetch(url, {
    cache: "no-store",
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req) {
  try {
    const {
      images = [],
      logos = [],
      captionImage,
      disclosureImage,
      ribbonImage,
    } = await req.json();

    if (!images.length) throw new Error("No images provided");
    if (!ribbonImage) throw new Error("Missing ribbonImage");

    while (images.length < 4) images.push(images[0]);
    images.length = 4;

    const CANVAS = 850;
    const IMG_W = 425;
    const IMG_H = 319;

    const RIBBON_TOP = IMG_H;
    const CAPTION_Y = RIBBON_TOP;
    const LOGO_TOP = RIBBON_TOP + 64;
    const LOGO_BOTTOM = RIBBON_TOP + 197;
    const DISCLOSURE_Y = RIBBON_TOP + 197;

    const base = sharp({
      create: {
        width: CANVAS,
        height: CANVAS,
        channels: 4,
        background: "#ffffff",
      },
    });

    const vehicleBuffers = await Promise.all(
      images.map(async (url) =>
        sharp(await fetchImage(url))
          .resize(IMG_W, IMG_H, { fit: "cover" })
          .png()
          .toBuffer()
      )
    );

    const layers = [
      { input: vehicleBuffers[0], left: 0, top: 0 },
      { input: vehicleBuffers[1], left: IMG_W, top: 0 },
      { input: vehicleBuffers[2], left: 0, top: CANVAS - IMG_H },
      { input: vehicleBuffers[3], left: IMG_W, top: CANVAS - IMG_H },
    ];

    layers.push({
      input: await fetchImage(ribbonImage),
      left: 0,
      top: RIBBON_TOP,
    });

    if (captionImage) {
      const resized = await sharp(await fetchImage(captionImage))
        .resize({ width: CANVAS, height: 64, fit: "inside" })
        .png()
        .toBuffer();

      layers.push({
        input: resized,
        left: 0,
        top: CAPTION_Y,
      });
    }

    if (logos.length) {
      const logoBuffers = await Promise.all(logos.map(fetchImage));
      const zoneH = LOGO_BOTTOM - LOGO_TOP;
      const maxH = Math.floor(zoneH * 0.9);
      const spacing = Math.floor(CANVAS / logos.length);

      for (let i = 0; i < logos.length; i++) {
        const resized = await sharp(logoBuffers[i])
          .resize({ height: maxH, fit: "inside" })
          .png()
          .toBuffer();

        const meta = await sharp(resized).metadata();

        layers.push({
          input: resized,
          left:
            logos.length === 1
              ? Math.floor((CANVAS - meta.width) / 2)
              : Math.floor(spacing * i + (spacing - meta.width) / 2),
          top: LOGO_TOP + Math.floor((zoneH - meta.height) / 2),
        });
      }
    }

    if (disclosureImage) {
      const resized = await sharp(await fetchImage(disclosureImage))
        .resize({ width: CANVAS, height: 15, fit: "inside" })
        .png()
        .toBuffer();

      layers.push({
        input: resized,
        left: 0,
        top: DISCLOSURE_Y,
      });
    }

    const finalPng = await base.composite(layers).png().toBuffer();

    return new NextResponse(finalPng, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": finalPng.length.toString(),
      },
    });
  } catch (err) {
    console.error("BUILD IMAGE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Image build failed" },
      { status: 500 }
    );
  }
}
