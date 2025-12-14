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

    // ---------------------------------------------
    // EXTRACT VIN (URL is the most reliable source)
    // ---------------------------------------------
    const vinMatch = url.match(/([A-HJ-NPR-Z0-9]{17})/i);
    if (!vinMatch) {
      return NextResponse.json(
        { error: "VIN not found in vehicle URL." },
        { status: 404 }
      );
    }

    const vin = vinMatch[1].toLowerCase();

    // ---------------------------------------------
    // IMAGE EXTRACTION — VIN SCOPED
    // ---------------------------------------------
    const images = [];
    const imgTags = root.querySelectorAll("img");

    for (const img of imgTags) {
      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("src");

      if (!src) continue;
      if (!src.includes("/inventoryphotos/")) continue;
      if (!src.toLowerCase().includes(vin)) continue;
      if (src.includes("placeholder") || src.includes("missing")) continue;

      images.push(src);

      if (images.length >= 4) break;
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No VIN-matched inventory images found." },
        { status: 404 }
      );
    }

    // Ensure exactly 4 images
    while (images.length < 4) {
      images.push(images[images.length - 1]);
    }

    return NextResponse.json({
      vin,
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
