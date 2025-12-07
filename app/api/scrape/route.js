import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Missing URL" },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();

    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const urls = [];
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];

      if (
        src.startsWith("http") &&
        !src.includes("logo") &&
        !src.includes("icon") &&
        !src.includes("svg")
      ) {
        urls.push(src);
      }
    }

    return NextResponse.json(
      { images: urls.slice(0, 20) },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to scrape images." },
      { status: 500 }
    );
  }
}
