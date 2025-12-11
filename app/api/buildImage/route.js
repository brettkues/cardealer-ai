import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { images, caption, logos } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No vehicle images provided." },
        { status: 400 }
      );
    }

    // -------- CANVAS SETTINGS --------
    const width = 1600;
    const height = 900;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // -------- LOAD VEHICLE IMAGES --------
    // Expected: exactly 4 images (first 4 from DealerOn)
    const imgs = [];
    for (let i = 0; i < Math.min(images.length, 4); i++) {
      try {
        const img = await loadImage(images[i]);
        imgs.push(img);
      } catch {}
    }

    // If fewer than 4 images load, fill the rest with blank boxes
    while (imgs.length < 4) {
      imgs.push(null);
    }

    const imgW = width / 2;
    const imgH = height / 2 - 60;

    // Draw 4 images in a 2x2 grid
    const positions = [
      { x: 0, y: 0 },
      { x: imgW, y: 0 },
      { x: 0, y: imgH },
      { x: imgW, y: imgH },
    ];

    positions.forEach((pos, i) => {
      if (imgs[i]) {
        ctx.drawImage(imgs[i], pos.x, pos.y, imgW, imgH);
      } else {
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(pos.x, pos.y, imgW, imgH);
      }
    });

    // -------- SEASONAL RIBBON --------
    // Pick ribbon color based on time of year
    const month = new Date().getMonth() + 1;

    let ribbonColor = "#000000";

    if (month === 12) ribbonColor = "#B30000"; // Christmas red
    else if (month === 10) ribbonColor = "#FF6A00"; // Halloween orange
    else if (month === 7) ribbonColor = "#002868"; // 4th of July navy
    else ribbonColor = "#000000"; // Default black

    const ribbonHeight = 120;

    // Draw ribbon
    ctx.fillStyle = ribbonColor;
    ctx.fillRect(0, height - ribbonHeight, width, ribbonHeight);

    // -------- CAPTION TEXT (centered) --------
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      caption || "",
      width / 2,
      height - ribbonHeight / 2
    );

    // -------- LOGOS (up to 3) --------
    const logoSize = 100;
    const spacing = 30;
    const totalWidth = logos.length * logoSize + (logos.length - 1) * spacing;
    let startX = width - totalWidth - 40;
    const startY = height - ribbonHeight + 10;

    for (const l of logos) {
      try {
        const img = await loadImage(l.url);
        ctx.drawImage(img, startX, startY, logoSize, logoSize);
      } catch {}
      startX += logoSize + spacing;
    }

    // -------- EXPORT --------
    const png = canvas.toBuffer("image/png");

    return NextResponse.json({
      output: `data:image/png;base64,${png.toString("base64")}`,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Image generation failed." },
      { status: 500 }
    );
  }
}
