import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Vehicle URL is required." },
        { status: 400 }
      );
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    // Extract images
    let images = [];

    // JSON-LD first
    const ldTags = root.querySelectorAll('script[type="application/ld+json"]');
    for (const tag of ldTags) {
      try {
        const json = JSON.parse(tag.innerText);
        if (json.image && Array.isArray(json.image)) {
          images = json.image.slice(0, 4);
          break;
        }
      } catch {}
    }

    // Fallback images
    if (images.length === 0) {
      root.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("data-src") || img.getAttribute("src");
        if (src && src.startsWith("http") && images.length < 4) {
          images.push(src);
        }
      });
    }

    // Extract year/make/model from title
    let title = root.querySelector("title")?.innerText || "";
    let year = "";
    let make = "";
    let model = "";

    const match = title.match(/(\d{4})\s+([A-Za-z]+)\s+(.+)/);
    if (match) {
      year = match[1];
      make = match[2];
      model = match[3].split("-")[0].trim();
    }

    return NextResponse.json({
      vehicle: { year, make, model, url },
      images,
    });
  } catch {
    return NextResponse.json(
      { error: "Lookup failed." },
      { status: 500 }
    );
  }
}
