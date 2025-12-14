import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid or missing vehicle URL." },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await response.text();
    const root = parse(html);

    // --------------------------------------------------
    // VEHICLE INFO (best-effort only)
    // --------------------------------------------------
    let year = "";
    let make = "";
    let model = "";

    const title = root.querySelector("title")?.innerText || "";
    const match = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);

    if (match) {
      year = match[1];
      make = match[2];
      model = match[3];
    }

    // --------------------------------------------------
    // IMAGE EXTRACTION — INVENTORY PHOTOS ONLY
    // --------------------------------------------------
    const images = [];

    const imgTags = root.querySelectorAll("img");

    for (const img of imgTags) {
      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("src");

      if (!src) continue;
      if (!src.startsWith("http")) continue;

      // 🔒 HARD RULES
      if (!src.includes("cdn.dlron.us/inventoryphotos")) continue;
      if (src.includes("placeholder")) continue;
      if (src.includes("missing")) continue;

      images.push(src);
      if (images.length >= 4) break;
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No valid inventory images found." },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // ENSURE EXACTLY 4 IMAGES (RECYCLE LAST)
    // --------------------------------------------------
    while (images.length < 4) {
      images.push(images[images.length - 1]);
    }

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    return NextResponse.json({
      vehicle: { year, make, model, url },
      images,
    });
  } catch (err) {
    console.error("LOOKUP ERROR:", err);
    return NextResponse.json(
      { error: "Vehicle lookup failed." },
      { status: 500 }
    );
  }
}
