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

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    // -------------------------------
    // FIND VIN (REQUIRED)
    // -------------------------------
    let vin = "";

    const vinMatch = html.match(/[A-HJ-NPR-Z0-9]{17}/);
    if (vinMatch) vin = vinMatch[0];

    if (!vin) {
      return NextResponse.json(
        { error: "VIN not found on page." },
        { status: 404 }
      );
    }

    // -------------------------------
    // FIND INVENTORY PHOTOS BY VIN
    // -------------------------------
    const images = [];

    root.querySelectorAll("img").forEach((img) => {
      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("src") ||
        "";

      if (
        src.includes("/inventoryphotos/") &&
        src.toLowerCase().includes(vin.toLowerCase())
      ) {
        if (!images.includes(src)) images.push(src);
      }
    });

    if (images.length === 0) {
      return NextResponse.json(
        {
          error: "No VIN-matched inventory photos found.",
          vin,
        },
        { status: 404 }
      );
    }

    // HARD RULE: EXACTLY 4 IMAGES
    const finalImages = images.slice(0, 4);
    while (finalImages.length < 4) {
      finalImages.push(finalImages[0]);
    }

    return NextResponse.json({
      vin,
      images: finalImages,
    });
  } catch (err) {
    console.error("LOOKUP ERROR:", err);
    return NextResponse.json(
      { error: "Vehicle lookup failed." },
      { status: 500 }
    );
  }
}
