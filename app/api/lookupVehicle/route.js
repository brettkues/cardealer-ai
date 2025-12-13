import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid or missing vehicle URL." },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    // -------------------------
    // IMAGE EXTRACTION (FIXED)
    // -------------------------
    const imgs = [];
    const seen = new Set();

    root.querySelectorAll("img").forEach((img) => {
      const src =
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("src");

      if (!src) return;
      if (!src.includes("cdn.dlron.us")) return;
      if (src.includes("placeholder")) return;
      if (src.includes("missing")) return;

      if (!seen.has(src)) {
        seen.add(src);
        imgs.push(src);
      }
    });

    if (imgs.length === 0) {
      return NextResponse.json(
        { error: "No vehicle images found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      images: imgs.slice(0, 4),
    });
  } catch (err) {
    console.error("LOOKUP ERROR:", err);
    return NextResponse.json(
      { error: "Lookup failed." },
      { status: 500 }
    );
  }
}
