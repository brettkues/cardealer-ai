import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

const VALID_PATH_HINTS = [
  "inventory",
  "inventoryphotos",
  "vehicle",
  "vehicles",
  "photos",
  "media"
];

const JUNK_HINTS = [
  "logo",
  "icon",
  "sprite",
  "placeholder",
  "blank",
  "loading",
  "pixel"
];

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing vehicle URL." },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
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

    let images = imgNodes
      .map((img) =>
        img.getAttribute("src") ||
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("data-original")
      )
      .filter(Boolean)
      .map((src) => {
        try {
          return new URL(src, url).href;
        } catch {
          return null;
        }
      })
      .filter(Boolean)

      // must look like a vehicle image path
      .filter((src) =>
        VALID_PATH_HINTS.some((hint) =>
          src.toLowerCase().includes(hint)
        )
      )

      // remove junk assets
      .filter((src) =>
        !JUNK_HINTS.some((junk) =>
          src.toLowerCase().includes(junk)
        )
      )

      // normalize (strip querystrings for dedupe)
      .map((src) => src.split("?")[0])

      // dedupe
      .filter((src, i, arr) => arr.indexOf(src) === i);

    // hard cap to keep UI sane
    images = images.slice(0, 40);

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
