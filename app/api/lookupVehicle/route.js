import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || url.trim() === "") {
      return NextResponse.json(
        { error: "Vehicle URL is required." },
        { status: 400 }
      );
    }

    const cleaned = url.trim();

    // FETCH THE VEHICLE PAGE
    const res = await fetch(cleaned, { method: "GET" }).catch(() => null);

    if (!res || !res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    // ---------------------------------------------------------
    // 1. IMAGES — DealerOn Type C Extraction
    // ---------------------------------------------------------
    let images = [];

    // Try <img data-src="">
    root.querySelectorAll("img").forEach((img) => {
      const ds = img.getAttribute("data-src");
      if (ds && ds.startsWith("http") && images.length < 4) {
        images.push(ds);
      }
    });

    // Try <img src="">
    if (images.length < 4) {
      root.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (src && src.startsWith("http") && images.length < 4) {
          images.push(src);
        }
      });
    }

    // Deduplicate
    images = [...new Set(images)].slice(0, 4);

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Could not extract images from the page." },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 2. YEAR / MAKE / MODEL from <title>
    // ---------------------------------------------------------
    let title = root.querySelector("title")?.innerText || "";
    title = title.replace(/\s+/g, " ").trim();

    // DealerOn example title:
    // "Used 2022 Jeep Grand Cherokee Limited 4x4 | Pischke Motors"
    const yearMatch = title.match(/(?:New|Used)?\s*(\d{4})/);
    const year = yearMatch ? yearMatch[1] : "";

    const parts = title.split(" ");
    const make = parts.find((p) => /^[A-Za-z]{3,}$/.test(p)) || "";
    const model = parts.slice(parts.indexOf(make) + 1).join(" ").split("|")[0].trim();

    // ---------------------------------------------------------
    // 3. VIN from URL (DealerOn always ends URL with VIN)
    // ---------------------------------------------------------
    const vinMatch = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/i);
    const vin = vinMatch ? vinMatch[0] : "";

    const vehicle = {
      year,
      make,
      model,
      vin,
      url: cleaned,
    };

    return NextResponse.json({
      vehicle,
      images,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lookup failed." },
      { status: 500 }
    );
  }
}
