import { NextResponse } from "next/server";
import axios from "axios";
import cheerio from "cheerio";

/**
 * Extract vehicles + next-page link from a single page.
 */
async function scrapePage(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(data);
    const vehicles = [];

    // Extract vehicles
    $(".vehicle, .inventory-card, .result-item, .card").each((i, el) => {
      const text = $(el).text().trim();

      const year =
        text.match(/\b(20\d{2}|19\d{2})\b/)?.[0] || "";

      const make =
        text.match(
          /\b(Ford|Chevrolet|Chevy|Toyota|Honda|Nissan|Jeep|Dodge|Ram|Chrysler|GMC|Hyundai|Kia|Volkswagen|Subaru|BMW|Mercedes|Lexus|Audi)\b/i
        )?.[0] || "";

      const model = text
        .replace(year, "")
        .replace(make, "")
        .trim()
        .split(/\s+/)[0] || "";

      const photos = [];
      $(el)
        .find("img")
        .each((_, img) => {
          const src =
            $(img).attr("data-src") ||
            $(img).attr("src") ||
            "";
          if (src && src.startsWith("http")) photos.push(src);
        });

      if (year && make && model) {
        vehicles.push({
          year,
          make,
          model,
          photos: photos.slice(0, 10),
        });
      }
    });

    // Find next page
    let nextPage = $("a.next, a[rel='next']")
      .attr("href");

    if (nextPage && !nextPage.startsWith("http")) {
      try {
        const base = new URL(url).origin;
        nextPage = base + nextPage;
      } catch {
        nextPage = null;
      }
    }

    return {
      vehicles,
      nextPage: nextPage || null,
    };
  } catch (err) {
    return { vehicles: [], nextPage: null };
  }
}

/**
 * Main API route
 */
export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL required" },
        { status: 400 }
      );
    }

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
