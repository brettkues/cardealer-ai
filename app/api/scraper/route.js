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

async function scrapePage(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  const $ = cheerio.load(response.data);
  let images = [];

  $("img").each((_, el) => {
    const raw =
      $(el).attr("data-src") ||
      $(el).attr("data-original") ||
      $(el).attr("src");

    if (!raw) return;

    if (
      raw.endsWith(".jpg") ||
      raw.endsWith(".jpeg") ||
      raw.endsWith(".png")
    ) {
      images.push(fixUrl(url, raw));
    }
  });

  // Find next page link
  let nextPage = null;

  $('a[href*="page"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const full = fixUrl(url, href);
    if (full !== url) nextPage = full;
  });

  return { images, nextPage };
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    let allImages = new Set();
    let nextUrl = url;
    let pageCount = 0;

    while (nextUrl && pageCount < 10) {
      const { images, nextPage } = await scrapePage(nextUrl);

      images.forEach((img) => allImages.add(img));

      // Stop if no more pages
      if (!nextPage ||
