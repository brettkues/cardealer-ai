import { NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

function getRibbonColor() {
  const m = new Date().getMonth() + 1;
  if (m <= 2 || m === 12) return "#5CA8FF";
  if (m <= 5) return "#65C67A";
  if (m <= 8) return "#1B4B9B";
  return "#D46A1E";
}

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
    } = await req.json();

    while (images.length < 4) images.push(images[0]);
    images = images.slice(0, 4);

    const canvas = 850;
    const imgW = 425;
    const imgH = 319;
    const ribbonH = 212;

    /* ===============================
       RIBBON-RELATIVE LAYOUT (FIXED)
       =============================== */
    const RIBBON_TOP = imgH; // 319

    const CAPTION_Y = RIBBON_TOP + 0;      // 319–383
    const LOGO_TOP = RIBBON_TOP + 64;       // 383
    const LOGO_BOTTOM = RIBBON_TOP + 197;   // 516
    const DISCLOSURE_Y = RIBBON_TOP + 197;  // 516–531

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

    /* ===== RIBBON ===== */
    const ribbon = await sharp({
      create: {
        width: canvas,
        height: ribbonH,
        channels: 4,
        background: getRibbonColor(),
      },
    })
      .png()
      .toBuffer();

    layers.push({ input: ribbon, left: 0, top: RIBBON_TOP });

    /* ===== CAPTION (TOP 30%) ===== */
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

    /* ===== LOGOS (MIDDLE 60%) ===== */
    if (logos.length > 0) {
      const logoBuffers = await Promise.all(logos.map(fetchImage));

      const logoZoneH = LOGO_BOTTOM - LOGO_TOP;
      const logoMaxH = Math.floor(logoZoneH * 0.9);

      if (logos.length === 1) {
        const resized = await sharp(logoBuffers[0])
          .resize({ height: logoMaxH, fit: "inside" })
          .toBuffer();

        const meta = await sharp(resized).metadata();

        layers.push({
          input: resized,
          left: Math.floor((canvas - meta.width) / 2),
          top: LOGO_TOP + Math.floor((logoZoneH - meta.height) / 2),
        });
      } else {
        const spacing = Math.floor(canvas / logos.length);

        for (let i = 0; i < logos.length; i++) {
          const resized = await sharp(logoBuffers[i])
            .resize({ height: logoMaxH, fit: "inside" })
            .toBuffer();

          const meta = await sharp(resized).metadata();

          layers.push({
            input: resized,
            left: Math.floor(
              spacing * i + (spacing - meta.width) / 2
            ),
            top: LOGO_TOP + Math.floor((logoZoneH - meta.height) / 2),
          });
        }
      }
    }

    /* ===== DISCLOSURE (BOTTOM STRIP) ===== */
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
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
