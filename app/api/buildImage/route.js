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
      ribbon, // ← NEW
    } = await req.json();

    if (!ribbon || !ribbon.backgroundColor) {
      throw new Error("Missing ribbon data");
    }

    while (images.length < 4) images.push(images[0]);
    images = images.slice(0, 4);

    const canvas = 850;
    const imgW = 425;
    const imgH = 319;
    const ribbonH = 212;

    /* ===============================
       RIBBON-RELATIVE LAYOUT (FIXED)
       =============================== */
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
        background: "#ffffff",
      },
    });

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
      { input: vehicleBuffers[3], left: imgW, top: canvas - imgH },
    ];

    /* ===== RIBBON BACKGROUND (DATA-DRIVEN) ===== */
    const ribbonBg = await sharp({
      create: {
        width: canvas,
        height: ribbonH,
        channels: 4,
        background: ribbon.backgroundColor,
      },
    })
      .png()
      .toBuffer();

    layers.push({ input: ribbonBg, left: 0, top: RIBBON_TOP });

    /* ===== CAPTION (TOP ZONE) ===== */
    if (captionImage) {
      const captionBuffer = Buffer.from(
        captionImage.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      const resized = await sharp(captionBuffer)
        .resize({
          width: canvas,
          height: 64,
          fit: "inside",
          withoutEnlargement: true,
        })
        .toBuffer();

      const meta = await sharp(resized).metadata();

      layers.push({
        input: resized,
        left: Math.floor((canvas - meta.width) / 2),
        top: CAPTION_Y,
      });
    }

    /* ===== LOGOS (MIDDLE ZONE) ===== */
    if (logos.length > 0) {
      const logoBuffers = await Promise.all(logos.map(fetchImage));

      const logoZoneH = LOGO_BOTTOM - LOGO_TOP;
      const logoMaxH = Math.floor(logoZoneH * 0.9);

      const spacing = Math.floor(canvas / logos.length);

      for (let i = 0; i < logos.length; i++) {
        const resized = await sharp(logoBuffers[i])
          .resize({ height: logoMaxH, fit: "inside" })
          .toBuffer();

        const meta = await sharp(resized).metadata();

        layers.push({
          input: resized,
          left: logos.length === 1
            ? Math.floor((canvas - meta.width) / 2)
            : Math.floor(spacing * i + (spacing - meta.width) / 2),
          top: LOGO_TOP + Math.floor((logoZoneH - meta.height) / 2),
        });
      }
    }

    /* ===== DISCLOSURE ===== */
    if (disclosureImage) {
      const disclosureBuffer = Buffer.from(
        disclosureImage.replace(/^data:image\/png;base64,/, ""),
        "base64"
      );

      const resized = await sharp(disclosureBuffer)
        .resize({
          width: canvas,
          height: 15,
          fit: "inside",
          withoutEnlargement: true,
        })
        .toBuffer();

      const meta = await sharp(resized).metadata();

      layers.push({
        input: resized,
        left: Math.floor((canvas - meta.width) / 2),
        top: DISCLOSURE_Y,
      });
    }

    const final = await base.composite(layers).png().toBuffer();

    return NextResponse.json({
      output: `data:image/png;base64,${final.toString("base64")}`,
    });
  } catch (err) {
    console.error("BUILD ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Image build failed." },
      { status: 500 }
    );
  }
}
