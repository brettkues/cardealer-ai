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

    // -----------------------------------
    // FETCH PAGE
    // -----------------------------------
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

    // -----------------------------------
    // VEHICLE META (best-effort, optional)
    // -----------------------------------
    let year = "";
    let make = "";
    let model = "";
    let trim = "";

    const title = root.querySelector("title")?.innerText || "";
    const titleMatch = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);

    if (titleMatch) {
      year = titleMatch[1];
      make = titleMatch[2];
      model = titleMatch[3];
    }

    // -----------------------------------
    // IMAGE EXTRACTION — SIMPLE & CORRECT
    // -----------------------------------
    const images = [];

    root.querySelectorAll("img").forEach((img) => {
      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("src");

      if (!src) return;
      if (!src.startsWith("http")) return;

      // Filter out junk
      const lower = src.toLowerCase();
      if (lower.includes("logo")) return;
      if (lower.includes("icon")) return;
      if (lower.includes("badge")) return;
      if (lower.includes("placeholder")) return;
      if (lower.includes("missing")) return;

      // Prefer real inventory photos
      if (
        lower.includes("cdn.dlron.us") ||
        lower.includes("inventoryphotos")
      ) {
        images.push(src);
      }
    });

    const finalImages = images.slice(0, 4);

    if (finalImages.length !== 4) {
      return NextResponse.json(
        { error: "Could not extract 4 vehicle images." },
        { status: 404 }
      );
    }

    // -----------------------------------
    // RETURN
    // -----------------------------------
    return NextResponse.json({
      vehicle: {
        year,
        make,
        model,
        trim,
        url,
      },
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
