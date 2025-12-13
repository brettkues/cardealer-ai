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

    // --------------------------------------------------
    // FETCH VEHICLE PAGE
    // --------------------------------------------------
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    }).catch(() => null);

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await response.text();
    const root = parse(html);

    // --------------------------------------------------
    // VEHICLE DATA
    // --------------------------------------------------
    let year = "";
    let make = "";
    let model = "";
    let trim = "";
    let vin = "";

    const dlScript = root
      .querySelectorAll("script")
      .find((s) => s.innerText.includes("vehicleYear"));

    if (dlScript) {
      try {
        year =
          dlScript.innerText.match(/vehicleYear":"(\d{4})"/)?.[1] || year;
        make =
          dlScript.innerText.match(/vehicleMake":"([^"]+)"/)?.[1] || make;
        model =
          dlScript.innerText.match(/vehicleModel":"([^"]+)"/)?.[1] || model;
        trim =
          dlScript.innerText.match(/vehicleTrim":"([^"]+)"/)?.[1] || trim;
        vin =
          dlScript.innerText.match(/vehicleVin":"([^"]+)"/)?.[1] || vin;
      } catch {}
    }

    if (!year || !make || !model) {
      const title = root.querySelector("title")?.innerText || "";
      const match = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);
      if (match) {
        year ||= match[1];
        make ||= match[2];
        model ||= match[3];
      }
    }

    // --------------------------------------------------
    // IMAGE EXTRACTION (SAFE + FORGIVING)
    // --------------------------------------------------
    const images = [];

    // 1️⃣ JSON-LD
    const ldTags = root.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    for (const tag of ldTags) {
      try {
        const json = JSON.parse(tag.innerText);
        if (json?.image) {
          if (Array.isArray(json.image)) {
            json.image.forEach((i) => {
              if (i.startsWith("http") && images.length < 4) images.push(i);
            });
          } else if (typeof json.image === "string") {
            images.push(json.image);
          }
        }
      } catch {}
    }

    // 2️⃣ IMG TAGS (DealerOn / Dealer.com)
    if (images.length === 0) {
      root.querySelectorAll("img").forEach((img) => {
        const src =
          img.getAttribute("data-src") ||
          img.getAttribute("data-lazy") ||
          img.getAttribute("src");

        if (!src || !src.startsWith("http")) return;
        if (/icon|badge|placeholder|pixel|logo/i.test(src)) return;

        if (images.length < 4) images.push(src);
      });
    }

    // 3️⃣ PICTURE SRCSET (Dealer Inspire)
    if (images.length === 0) {
      root.querySelectorAll("picture source").forEach((p) => {
        const src = p.getAttribute("srcset");
        if (src && src.startsWith("http") && images.length < 4) {
          images.push(src);
        }
      });
    }

    // 🔑 CRITICAL: only fail if NOTHING was found
    if (images.length === 0) {
      return NextResponse.json(
        { error: "Could not extract vehicle images." },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // FINAL RESPONSE
    // --------------------------------------------------
    return NextResponse.json({
      vehicle: {
        year,
        make,
        model,
        trim,
        vin,
        url,
      },
      images,
    });
  } catch (err) {
    console.error("LOOKUP ERROR:", err);
    return NextResponse.json(
      { error: "Lookup failed." },
      { status: 500 }
    );
  }
}
