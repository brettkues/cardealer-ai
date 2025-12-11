import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const html = await fetch(url).then((r) => r.text());
    const root = parse(html);

    // YEAR/MAKE/MODEL EXTRACTION
    let title =
      root.querySelector("h1")?.text.trim() ||
      root.querySelector("title")?.text.trim() ||
      "";

    const titleMatch = title.match(/(\d{4})\s+([A-Za-z]+)\s+(.*)/);
    const year = titleMatch?.[1] || "";
    const make = titleMatch?.[2] || "";
    const model = titleMatch?.[3] || "";

    // IMAGE SCRAPING
    let images = [
      ...root.querySelectorAll("img"),
    ]
      .map((img) => img.getAttribute("src"))
      .filter((src) => src && !src.startsWith("data:"));

    // Deduplicate
    images = [...new Set(images)];

    return NextResponse.json({
      success: true,
      data: { year, make, model, images },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Scraper failed" },
      { status: 500 }
    );
  }
}
