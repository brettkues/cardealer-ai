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
    let { images, caption = "", logos = [] } = await req.json();

    while (images.length < 4) images.push(images[0]);
    images = images.slice(0, 4);

    const canvas = 850;
    const imgW = 425;
    const imgH = 319;
    const ribbonH = 212;

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

    layers.push({ input: ribbon, left: 0, top: imgH });

    const hasCaption = caption.trim().length > 0;
    const logoCount = logos.length;

    const contentTop = imgH;
    const captionH = hasCaption ? Math.floor(ribbonH * 0.4) : 0;
    const logoAreaH = ribbonH - captionH;

    // ✅ CAPTION — DejaVu Sans (fixes squares)
    if (hasCaption) {
      const safe = caption
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const svg = `
        <svg width="${canvas}" height="${captionH}">
          <style>
            text {
              font-family: "DejaVu Sans";
              font-size: 36px;
              fill: white;
            }
          </style>
          <text
            x="50%"
            y="50%"
            text-anchor="middle"
            dominant-baseline="middle"
          >
            ${safe}
          </text>
        </svg>
      `;

      layers.push({
        input: Buffer.from(svg),
        left: 0,
        top: contentTop,
      });
    }

    // Logos (unchanged, already correct)
    if (logoCount > 0) {
      const logoBuffers = await Promise.all(
        logos.map(async (url) => fetchImage(url))
      );

      let logoHeight;
      if (!hasCaption) {
        logoHeight = Math.floor(ribbonH * 0.5);
      } else if (logoCount === 1) {
        logoHeight = Math.floor(ribbonH * 0.35);
      } else {
        logoHeight = Math.floor(ribbonH * 0.3);
      }

      const logoY =
        contentTop + captionH + Math.floor((logoAreaH - logoHeight) / 2);

      if (logoCount === 1) {
        const resized = await sharp(logoBuffers[0])
          .resize({ height: logoHeight })
          .toBuffer();

        const meta = await sharp(resized).metadata();

        layers.push({
          input: resized,
          left: Math.floor((canvas - meta.width) / 2),
          top: logoY,
        });
      } else {
        const spacing = Math.floor(canvas / logoCount);

        for (let i = 0; i < logoCount; i++) {
          const resized = await sharp(logoBuffers[i])
            .resize({ height: logoHeight })
            .toBuffer();

          const meta = await sharp(resized).metadata();

          layers.push({
            input: resized,
            left: Math.floor(spacing * i + (spacing - meta.width) / 2),
            top: logoY,
          });
        }
      }
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
