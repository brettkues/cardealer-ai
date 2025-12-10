import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Missing URL" },
        { status: 400 }
      );
    }

    // Fetch page HTML
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    let images = [];

    $("img").each((i, el) => {
      const raw =
        $(el).attr("data-src") ||
        $(el).attr("data-original") ||
        $(el).attr("src");

      if (!raw) return;

      // Only allow usable image formats
      if (
        raw.endsWith(".jpg") ||
        raw.endsWith(".jpeg") ||
        raw.endsWith(".png")
      ) {
        let finalUrl = raw;

        // Fix relative URLs
        if (!raw.startsWith("http")) {
          const base = url.endsWith("/") ? url.slice(0, -1) : url;
          if (raw.startsWith("/")) {
            finalUrl = base + raw;
          } else {
            finalUrl = base + "/" + raw;
          }
        }

        images.push(finalUrl);
      }
    });

    // Remove duplicates
    images = [...new Set(images)];

    return NextResponse.json({
      images,
      message:
        images.length === 0
          ? "No images found. Try a different URL."
          : `Found ${images.length} images.`,
    });
  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    return NextResponse.json(
      { error: "Scraper failed" },
      { status: 500 }
    );
  }
}
