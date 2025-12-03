export const dynamic = "force-dynamic";   // REQUIRED so Vercel doesn't optimize it

import * as cheerio from "cheerio";
import { corsHeaders, handleCors } from "../../utils/cors";

function extractImages($, url) {
  const images = [];

  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("http")) {
      images.push(src);
    }
  });

  return images.slice(0, 10); // limit for safety
}

function extractDescription($) {
  const title = $("h1, .title, .vehicle-title").first().text().trim();
  const price = $(".price, .vehicle-price").first().text().trim();
  const details = $(".description, .vehicle-info").first().text().trim();

  return [title, price, details].filter(Boolean).join(" | ");
}

export async function POST(req) {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing URL" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const images = extractImages($, url);
    const description = extractDescription($);

    return new Response(
      JSON.stringify({ images, description }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
