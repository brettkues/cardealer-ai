import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing URL" }, { status: 400 });

    const html = await fetch(url).then(r => r.text());
    const root = parse(html);

    // BASIC Y/M/M fallback
    let title = root.querySelector("title")?.innerText || "";
    let ymm = title.split(" ").slice(0, 3).join(" ");

    // GENERIC image fallback
    const imgs = root.querySelectorAll("img")
      .map(i => i.getAttribute("src"))
      .filter(Boolean)
      .filter(src =>
        src.endsWith(".jpg") ||
        src.endsWith(".jpeg") ||
        src.endsWith(".png")
      );

    const unique = [...new Set(imgs)];
    const four = unique.slice(0, 4);

    return NextResponse.json({
      ymm,
      images: four,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Scraper failed", details: err.message },
      { status: 500 }
    );
  }
}
