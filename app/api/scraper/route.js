import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

function fixUrl(base, src) {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return "https:" + src;

  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (src.startsWith("/")) return cleanBase + src;
  return cleanBase + "/" + src;
}

function parseTitle(text) {
  if (!text) return null;

  const parts = text.split(" ");

  const year = parts[0]?.match(/^\d{4}$/) ? parts[0] : null;
  if (!year) return null;

  const make = parts[1] || null;
  const model = parts[2] || null;

  if (!make || !model) return null;

  return { year, make, model };
}

async function scrapeInventoryPage(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  const $ = cheerio.load(response.data);

  let vehicles = [];

  $(".vehicle-card, .inventory-card, .result-item, .vehicle, .product").each(
    (i, el) => {
      const title =
        $(el).find(".title").text().trim() ||
        $(el).find("h2").text().trim() ||
        $(el).find("h3").text().trim() ||
        $(el).text().trim().substring(0, 50);

      const parsed = parseTitle(title);

      if (!parsed) return;

      let photos = [];

      $(el)
        .find("img")
        .each((j, img) => {
          const raw =
            $(img).attr("data-src") ||
            $(img).attr("data-original") ||
            $(img).attr("src");

          if (!raw) return;

          if (
            raw.endsWith(".jpg") ||
            raw.endsWith(".jpeg") ||
            raw.endsWith(".png")
          ) {
            photos.push(fixUrl(url, raw));
          }
        });

      photos = [...new Set(photos)];

      vehicles.push({
        year: parsed.year,
        make: parsed.make,
        model: parsed.model,
        photos,
      });
    }
  );

  // PAGINATION DETECTION
  let nextPage = null;
  $('a[href*="page"], a[rel="next"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const full = fixUrl(url, href);

    if (full !== url) nextPage = full;
  });

  return { vehicles, nextPage };
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    let allVehicles = [];
    let nextUrl = url;
    let count = 0;

    while (nextUrl && count < 10) {
      const { vehicles, nextPage } = await scrapeInventoryPage(nextUrl);

      allVehicles.push(...vehicles);

      if (!nextPage || nextPage === nextUrl) break;

      nextUrl = nextPage;
      count++;
    }

    return NextResponse.json({
      vehicles: allVehicles,
      count: allVehicles.length,
      pages: count + 1,
    });
  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
