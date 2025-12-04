export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import cheerio from "cheerio";                 // ← FIXED IMPORT
import { corsHeaders, handleCors } from "../../utils/cors";

/** Extract vehicle images */
function extractImages($, url) {
  let images = [];

  $("img").each((_, img) => {
    const src = $(img).attr("src");
    if (src && src.startsWith("http") && !images.includes(src)) {
      images.push(src);
    }
  });

  // Fallback
  if (images.length < 4) {
    images = images.slice(0, 4);
  }

  return images;
}

/** Extract description */
function extractDescription($) {
  const metaDesc = $('meta[name="description"]').attr("content");
  if (metaDesc) return metaDesc;

  const ogDesc = $('meta[property="og:description"]').attr("content");
  if (ogDesc) return ogDesc;

  return "Vehicle listing.";
}

export async function POST(req) {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing URL" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to load page" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const images = extractImages($, url);
    const description = extractDescription($);

    return new Response(
      JSON.stringify({
        images,
        description,
        url,
      }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
