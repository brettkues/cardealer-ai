import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

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
      const { data } = await axios.get(nextPage);
      const $ = cheerio.load(data);

      $(".vehicle-card, .result-item, .inventory-card").each((i, el) => {
        const year = $(el).find(".year, .vehicle-year").text().trim();
        const make = $(el).find(".make, .vehicle-make").text().trim();
        const model = $(el).find(".model, .vehicle-model").text().trim();

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
            id: `${Date.now()}-${i}`,
            year,
            make,
            model,
            photos,
          });
        }
      });

      const nextBtn =
        $("a.next, a[rel='next']").attr("href") ||
        $(".pagination .next a").attr("href");

      if (!nextBtn) break;

      nextPage = nextBtn.startsWith("http")
        ? nextBtn
        : new URL(nextBtn, url).toString();

      loops++;
    }

    return NextResponse.json({ vehicles });
  } catch (err) {
    return NextResponse.json({ error: "Scraper failed." }, { status: 500 });
  }
}
