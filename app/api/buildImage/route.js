import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { vehicle, images, caption, logos } = await req.json();

    if (!images?.length) {
      return NextResponse.json(
        { error: "No vehicle images provided." },
        { status: 400 }
      );
    }

    // -------------------------------------
    // CANVAS SETUP
    // -------------------------------------
    const size = 850;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);

    // -------------------------------------
    // LOAD VEHICLE IMAGES
    // -------------------------------------
    const maxImg = 4;
    const selectedImgs = images.slice(0, maxImg);

    const loaded = await Promise.all(
      selectedImgs.map(async (url) => {
        try {
          return await loadImage(url);
        } catch {
          return null;
        }
      })
    );

    const valid = loaded.filter((img) => img);

    if (valid.length === 0) {
      return NextResponse.json(
        { error: "Could not load vehicle images." },
        { status: 400 }
      );
    }

    // -------------------------------------
    // DRAW 2×2 GRID
    // -------------------------------------
    const cell = size / 2;

    valid.forEach((img, i) => {
      if (!img) return;

      const row = Math.floor(i / 2);
      const col = i % 2;

      // crop to square center
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;

      const dx = col * cell;
      const dy = row * cell;

      ctx.drawImage(img, sx, sy, s, s, dx, dy, cell, cell);
    });

    // -------------------------------------
    // RIBBON (Ribbon Style C)
    // -------------------------------------
    const ribbonHeight = Math.floor(size * 0.20);

    const gradient = ctx.createLinearGradient(0, size - ribbonHeight, 0, size);
    gradient.addColorStop(0, "#111");
    gradient.addColorStop(1, "#333");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, size - ribbonHeight, size, ribbonHeight);

    // -------------------------------------
    // DRAW LOGOS (Centered Above Caption)
    // -------------------------------------
    const usableLogos = logos?.slice(0, 3) || [];
    const ribbonTop = size - ribbonHeight;

    if (usableLogos.length > 0) {
      const loadedLogos = await Promise.all(
        usableLogos.map(async (l) => {
          try {
            return await loadImage(l.url);
          } catch {
            return null;
          }
        })
      );

      const good = loadedLogos.filter((x) => x);

      if (good.length > 0) {
        const maxLogoH = Math.floor(ribbonHeight * 0.30);
        const totalW =
          good.reduce((acc, logo) => {
            const scale = maxLogoH / logo.height;
            acc += logo.width * scale;
            return acc;
          }, 0) +
          (good.length - 1) * 20;

        let x = (size - totalW) / 2;
        const y = ribbonTop + 10;

        good.forEach((logo) => {
          const scale = maxLogoH / logo.height;
          const w = logo.width * scale;
          const h = maxLogoH;
          ctx.drawImage(logo, x, y, w, h);
          x += w + 20;
        });
      }
    }

    // -------------------------------------
    // DRAW CAPTION (Centered Below Logos)
    // -------------------------------------
    if (caption?.trim()) {
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let fontSize = 32;
      ctx.font = `${fontSize}px sans-serif`;

      while (ctx.measureText(caption).width > size - 80 && fontSize > 14) {
        fontSize -= 2;
        ctx.font = `${fontSize}px sans-serif`;
      }

      const captionY = size - ribbonHeight + ribbonHeight * 0.68;
      ctx.fillText(caption, size / 2, captionY);
    }

    // -------------------------------------
    // RETURN PNG
    // -------------------------------------
    const png = canvas.toBuffer("image/png");
    const base64 = `data:image/png;base64,${png.toString("base64")}`;

    return NextResponse.json({ output: base64 });
  } catch (err) {
    console.error("BUILD ERROR:", err);
    return NextResponse.json(
      { error: "Failed to build image." },
      { status: 500 }
    );
  }
}
