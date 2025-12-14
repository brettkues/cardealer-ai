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
    // VEHICLE INFO (best-effort, non-blocking)
    // --------------------------------------------------
    let year = "";
    let make = "";
    let model = "";

    const title = root.querySelector("title")?.innerText || "";
    const titleMatch = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);

    if (titleMatch) {
      year = titleMatch[1];
      make = titleMatch[2];
      model = titleMatch[3];
    }

    // --------------------------------------------------
    // IMAGE EXTRACTION — VEHICLE GALLERY ONLY
    // --------------------------------------------------
    let images = [];

    // DealerOn / Dealer Inspire gallery containers
    const gallerySelectors = [
      '[class*="vehicle-gallery"]',
      '[class*="vdp-gallery"]',
      '[class*="media-gallery"]',
      '[id*="vehicle-gallery"]',
    ];

    let galleryRoot = null;

    for (const sel of gallerySelectors) {
      galleryRoot = root.querySelector(sel);
      if (galleryRoot) break;
    }

    // If gallery container found, pull ONLY images inside it
    if (galleryRoot) {
      const imgs = galleryRoot.querySelectorAll("img");

      for (const img of imgs) {
        const src =
          img.getAttribute("data-src") ||
          img.getAttribute("data-lazy") ||
          img.getAttribute("src");

        if (!src) continue;
        if (!src.startsWith("http")) continue;

        // STRICT FILTER — NO STOCK
        if (src.includes("/assets/stock/")) continue;
        if (src.includes("placeholder")) continue;
        if (src.includes("missing")) continue;
        if (src.includes("logo")) continue;
        if (src.includes("icon")) continue;

        // Prefer real inventory photos
        if (
          src.includes("inventoryphoto") ||
          src.includes("inventoryphotos")
        ) {
          images.push(src);
        }

        if (images.length >= 4) break;
      }
    }

    // --------------------------------------------------
    // FINAL SAFETY NET — NEVER RETURN STOCK
    // --------------------------------------------------
    images = images.filter(
      (src) =>
        src.includes("inventoryphoto") ||
        src.includes("inventoryphotos")
    );

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No valid vehicle images found." },
        { status: 404 }
      );
    }

    // Ensure exactly 4 images (recycle if needed)
    while (images.length < 4) {
      images.push(images[images.length - 1]);
    }

    images = images.slice(0, 4);

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
