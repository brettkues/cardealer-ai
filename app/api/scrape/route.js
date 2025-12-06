import { NextResponse } from "next/server";

/**
 * Simple HTML scraper for dealership vehicle pages.
 * Extracts ALL <img> tags and returns up to 20 image URLs.
 */
export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Fetch the HTML of the vehicle page
    const res = await fetch(url);
    const html = await res.text();

    // Match all <img src="..."> URLs
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const urls = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];

      // Skip icons and junk
      if (
        src.startsWith("http") &&
        !src.includes("logo") &&
        !src.includes("icon") &&
        !src.includes("svg")
      ) {
        urls.push(src);
      }
    }

    // Return first 20 images maximum
    return NextResponse.json({
      images: urls.slice(0, 20)
    });

  } catch (err) {
    console.error("Scrape Error:", err);
    return NextResponse.json(
      { error: "Failed to scrape images" },
      { status: 500 }
    );
  }
}
