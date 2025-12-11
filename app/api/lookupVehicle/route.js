import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { website, identifier } = await req.json();

    if (!website || !identifier) {
      return NextResponse.json(
        { error: "Website and stock/VIN are required." },
        { status: 400 }
      );
    }

    const normalizedSite = website.replace(/\/$/, "");

    const isFullVIN = identifier.length === 17;
    const isLast8 = identifier.length === 8;
    const isStock = !isFullVIN && !isLast8;

    // POSSIBLE SEARCH URLS (DealerOn)
    const searchURLs = [
      `${normalizedSite}/search?stock=${identifier}`,
      `${normalizedSite}/search?stocknumber=${identifier}`,
      `${normalizedSite}/search?keyword=${identifier}`,
      `${normalizedSite}/search?vin=${identifier}`,
      `${normalizedSite}/search?last8=${identifier}`,
    ];

    let vehicleURL = null;

    // TRY ALL SEARCH URLS
    for (const url of searchURLs) {
      const res = await fetch(url, { method: "GET" }).catch(() => null);
      if (!res || !res.ok) continue;

      const html = await res.text();
      const root = parse(html);

      // DealerOn often embeds links like:
      // <a href="/used-City-2024-Make-Model-Trim-VIN">
      const link = root.querySelector("a[href*='-used'], a[href*='-Used'], a[href*='-new'], a[href*='-New']");
      if (link) {
        const href = link.getAttribute("href");
        if (href && href.includes(identifier.slice(-8))) {
          vehicleURL = normalizedSite + href;
          break;
        }
      }
    }

    // If no vehicleURL found and user manually typed a direct page, use it
    if (!vehicleURL && website.includes(identifier.slice(-8))) {
      vehicleURL = website;
    }

    if (!vehicleURL) {
      return NextResponse.json(
        { error: "Vehicle not found. Try entering full VIN or URL manually." },
        { status: 404 }
      );
    }

    // FETCH THE VEHICLE PAGE
    const pageRes = await fetch(vehicleURL, { method: "GET" }).catch(() => null);
    if (!pageRes || !pageRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const pageHtml = await pageRes.text();
    const root = parse(pageHtml);

    // EXTRACT IMAGES
    let images = [];

    // Try JSON-LD first
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

    // Try data-src in HTML if needed
    if (images.length === 0) {
      root.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("data-src") || img.getAttribute("src");
        if (src && src.startsWith("http") && images.length < 4) {
          images.push(src);
        }
      });
    }

    // EXTRACT TITLE FOR YEAR/MAKE/MODEL
    let title = root.querySelector("title")?.innerText || "";
    let year = "";
    let make = "";
    let model = "";

    const match = title.match(/(\d{4})\s+([A-Za-z]+)\s+(.+)/);
    if (match) {
      year = match[1];
      make = match[2];
      model = match[3].split("-")[0].trim(); // remove extra tokens
    }

    return NextResponse.json({
      vehicle: { year, make, model, url: vehicleURL },
      images,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lookup failed." },
      { status: 500 }
    );
  }
}
