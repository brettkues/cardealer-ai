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

    // ---- FIND IMAGE ELEMENTS (KEEP THIS FLEXIBLE) ----
    const imgNodes = root.querySelectorAll("img");

    const images = imgNodes
      .map((img) => {
        // try common attributes in order of reliability
        return (
          img.getAttribute("src") ||
          img.getAttribute("data-src") ||
          img.getAttribute("data-lazy") ||
          img.getAttribute("data-original") ||
          img.getAttribute("data-image")
        );
      })
      .filter(Boolean)
      .map((src) => {
        // normalize to absolute URL
        try {
          return new URL(src, url).href;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      // remove tiny icons / junk
      .filter((src) => !src.includes("sprite"))
      // dedupe
      .filter((src, i, arr) => arr.indexOf(src) === i);

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No vehicle images found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      images
    });

  } catch (err) {
    console.error("LOOKUP ERROR:", err);
    return NextResponse.json(
      { error: "Vehicle lookup failed." },
      { status: 500 }
    );
  }
}
