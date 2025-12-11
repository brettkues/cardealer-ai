export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const vehicles = [];
    let nextPage = url;
    let loops = 0;

    while (nextPage && loops < 5) {
      const html = await fetch(nextPage).then((r) => r.text());
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      const items = doc.querySelectorAll(
        ".vehicle-card, .result-item, .inventory-card"
      );

      items.forEach((el, i) => {
        const year =
          el.querySelector(".year, .vehicle-year")?.textContent.trim() || "";
        const make =
          el.querySelector(".make, .vehicle-make")?.textContent.trim() || "";
        const model =
          el.querySelector(".model, .vehicle-model")?.textContent.trim() || "";

        const photos = Array.from(el.querySelectorAll("img"))
          .map((img) => img.src)
          .filter((src) => src.startsWith("http"));

        if (year && make && model) {
          vehicles.push({
            id: `${Date.now()}-${i}`,
            year,
            make,
            model,
            photos,
          });
        }
      });

      const nextLink =
        doc.querySelector("a.next, a[rel='next'], .pagination .next a")?.href ||
        "";

      if (!nextLink) break;

      nextPage = nextLink.startsWith("http")
        ? nextLink
        : new URL(nextLink, nextPage).toString();

      loops++;
    }

    return NextResponse.json({ vehicles });
  } catch (err) {
    return NextResponse.json(
      { error: "Scraper failed" },
      { status: 500 }
    );
  }
}

// Required for DOM parsing without Cheerio
import { JSDOM } from "jsdom";
