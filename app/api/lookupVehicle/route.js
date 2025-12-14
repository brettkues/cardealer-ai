import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing vehicle URL." },
        { status: 400 }
      );
    }

    const pageUrl = new URL(url);
    const pageOrigin = pageUrl.origin;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    const imgNodes = root.querySelectorAll("img");

    const images = imgNodes
      .map((img) =>
        img.getAttribute("src") ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("data-original")
      )
      .filter(Boolean)
      .map((src) => {
        try {
          return new URL(src, pageOrigin).href;
        } catch {
          return null;
        }
      })
      .filter(Boolean)

      // ✅ ONLY first-party inventory photos
      .filter(
        (src) =>
          src.startsWith(pageOrigin + "/inventoryphotos/")
      )

      // normalize & dedupe
      .map((src) => src.split("?")[0])
      .filter((src, i, arr) => arr.indexOf(src) === i);

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No vehicle images found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ images });

  } catch (err) {
    console.error("LOOKUP ERROR:", err);
    return NextResponse.json(
      { error: "Vehicle lookup failed." },
      { status: 500 }
    );
  }
}
