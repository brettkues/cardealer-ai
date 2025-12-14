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

    // 🔑 Extract VIN from URL or page (17 chars, no I/O/Q)
    const vinMatch = url.match(/[A-HJ-NPR-Z0-9]{17}/i);
    const vin = vinMatch ? vinMatch[0].toLowerCase() : null;

    if (!vin) {
      return NextResponse.json(
        { error: "VIN not found in vehicle URL." },
        { status: 400 }
      );
    }

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

      // ✅ First-party inventory photos only
      .filter(
        (src) =>
          src.startsWith(pageOrigin + "/inventoryphotos/") &&
          src.toLowerCase().includes(vin)
      )

      // ❌ Exclusions
      .filter(
        (src) =>
          !src.toLowerCase().includes("/thumbs/") &&
          !src.toLowerCase().includes("autocheck") &&
          !src.toLowerCase().includes("carfax")
      )

      // Normalize & dedupe
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
