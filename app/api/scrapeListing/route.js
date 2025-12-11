import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req = new NextRequest()) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    // Title extraction
    let titleText = root.querySelector("title")?.innerText || "";

    const ogTitle = root
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content");

    if (ogTitle) titleText = ogTitle;

    // JSON-LD vehicle data
    const ld = root.querySelectorAll('script[type="application/ld+json"]');
    for (const tag of ld) {
      try {
        const data = JSON.parse(tag.innerText);

        if (data?.["@type"] === "Vehicle" || data?.["@type"] === "Car") {
          if (data.name) {
            titleText = data.name;
            break;
          }
        }
      } catch {}
    }

    // Year/Make/Model parsing
    let year = "";
    let make = "";
    let model = "";

    const match = titleText.match(/^(?<year>\d{4})\s+(?<make>\w+)\s+(?<model>.+)/);

    if (match?.groups) {
      ({ year, make, model } = match.groups);
    } else {
      const parts = titleText.split(" ");
      if (parts.length >= 3) {
        year = parts[0];
        make = parts[1];
        model = parts.slice(2).join(" ");
      } else {
        model = titleText;
      }
    }

    // Image extraction
    const images = [];

    root.querySelectorAll('meta[property="og:image"]').forEach((m) => {
      const src = m.getAttribute("content");
      if (src) images.push(src);
    });

    if (images.length === 0) {
      root.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("http") && images.length < 5) {
          images.push(src);
        }
      });
    }

    return NextResponse.json({
      year,
      make,
      model,
      images,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
