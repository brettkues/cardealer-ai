export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import cheerio from "cheerio";              // ← FIXED: CJS import, not ESM
import { corsHeaders, handleCors } from "../../utils/cors";

/** Extract vehicle images */
function extractImages($, url) {
  const images = [];
  $("img").each((_, img) => {
    const src = $(img).attr("src");
    if (src && src.startsWith("http")) images.push(src);
  });
  return images.slice(0, 4);
}

/** Extract description */
function extractDescription($) {
  const title = $("title").first().text().trim();
  return title || "Vehicle";
}

export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing URL" }), {
        status: 400,
        headers: corsHeaders()
      });
    }

    // Fetch page HTML
    const res = await fetch(url);
    const html = await res.text();

    // Parse with CJS Cheerio (works on Vercel)
    const $ = cheerio.load(html);

    const images = extractImages($, url);
    const description = extractDescription($);

    return new Response(JSON.stringify({ images, description }), {
      status: 200,
      headers: corsHeaders()
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}
