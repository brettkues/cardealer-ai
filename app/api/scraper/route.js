import { NextResponse } from "next/server";

function fixUrl(base, src) {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function parseVehicle(title) {
  if (!title) return null;

  const parts = title.trim().split(/\s+/);

  const year = /^\d{4}$/.test(parts[0]) ? parts[0] : null;
  if (!year) return null;

  const make = parts[1] || null;
  const model = parts[2] || null;

  if (!make || !model) return null;

  return { year, make, model };
}

async function scrapePage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let vehicles = [];

  const cards = doc.querySelectorAll(
    ".vehicle-card, .inventory-card, .result-item, .vehicle, .product, .card"
  );

  cards.forEach((card) => {
    const titleElement =
      card.querySelector(".title, h2, h3") || card;

    const title = titleElement.textContent.trim();
    const parsed = parseVehicle(title);

    if (!parsed) return;

    let photos = [];

    const imgs = card.querySelectorAll("img");
    imgs.forEach((img) => {
      const raw =
        img.getAttribute("data-src") ||
        img.getAttribute("data-original") ||
        img.getAttribute("src");

      if (!raw) return;

      if (
        raw.endsWith(".jpg") ||
        raw.endsWith(".jpeg") ||
        raw.endsWith(".png")
      ) {
        const fixed = fixUrl(url, raw);
        if (fixed) photos.push(fixed);
      }
    });

    photos = [...new Set(photos)];

    vehicles.push({
      year: parsed.year,
      make: parsed.make,
      model: parsed.model,
      photos,
    });
  });

  // Pagination
  let nextPage = null;
  const pageLinks = doc.querySelectorAll('a[href*="page"], a[rel="next"]');

  pageLinks.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    const full = fixUrl(url, href);
    if (full !== url) nextPage = full;
  });

  return { vehicles, nextPage };
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url)
      return NextResponse.json(
        { error: "URL required" },
        { status: 400 }
      );

    let all = [];
    let next = url;
    let limit = 0;

    while (next && limit < 10) {
      const { vehicles, nextPage } = await scrapePage(next);

      all.push(...vehicles);

      if (!nextPage || nextPage === next) break;

      next = nextPage;
      limit++;
    }

    return NextResponse.json({
      vehicles: all,
      count: all.length,
      pages: limit + 1,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "scraper failed" },
      { status: 500 }
    );
  }
}
