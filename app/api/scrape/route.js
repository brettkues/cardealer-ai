import * as cheerio from "cheerio";
import { corsHeaders, handleCors } from "@/app/utils/cors";

/** Extracts vehicle images */
function extractImages($, url) {
  const images = [];
  const base = new URL(url).origin;

  $("img").each((i, el) => {
    const src = $(el).attr("src");
    if (!src) return;

    if (src.includes("inventoryphotos") || src.includes("photos") || src.includes("vehicle")) {
      if (src.startsWith("http")) images.push(src);
      else images.push(base + src);
    }
  });

  return [...new Set(images)];
}

/** Extracts vehicle description */
function extractDescription($) {
  let description = "";

  const selectors = [
    ".vehicle-summary",
    ".description",
    ".vehicle-description",
    "#description",
    ".col-md-8 p",
    ".col-md-8 div",
    "p",
    "div"
  ];

  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 40 && text.length < 1500) description = text;
    });
    if (description) break;
  }

  return description || "No description found.";
}

export async function POST(request) {
  // Handle OPTIONS preflight
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { url, descriptionOnly } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "No URL provided." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const res = await fetch(url);
    const html = await res.text();

    const $ = cheerio.load(html);

    // Description-only mode
    if (descriptionOnly) {
      const description = extractDescription($);
      return new Response(JSON.stringify({ description }), {
        status: 200,
        headers: corsHeaders(),
      });
    }

    // Full scrape
    const images = extractImages($, url).slice(0, 8);
    const description = extractDescription($);

    return new Response(JSON.stringify({ images, description }), {
      status: 200,
      headers: corsHeaders(),
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
