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
    // FETCH PAGE
    // --------------------------------------------------
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await response.text();
    const root = parse(html);

    // --------------------------------------------------
    // VEHICLE META (BEST EFFORT — NOT CRITICAL)
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
          dlScript.innerText.match(/vehicleYear":"(\d{4})"/)?.[1] || "";
        make =
          dlScript.innerText.match(/vehicleMake":"([^"]+)"/)?.[1] || "";
        model =
          dlScript.innerText.match(/vehicleModel":"([^"]+)"/)?.[1] || "";
        trim =
          dlScript.innerText.match(/vehicleTrim":"([^"]+)"/)?.[1] || "";
        vin =
          dlScript.innerText.match(/vehicleVin":"([^"]+)"/)?.[1] || "";
      } catch {}
    }

    // --------------------------------------------------
    // INVENTORY IMAGES — THIS IS THE IMPORTANT PART
    // --------------------------------------------------
    const allImgs = root
      .querySelectorAll("img")
      .map((img) =>
        img.getAttribute("data-src") ||
        img.getAttribute("data-lazy") ||
        img.getAttribute("src")
      )
      .filter(Boolean);

    // ONLY inventory photos — NEVER stock
    let images = allImgs.filter((src) =>
      src.includes("cdn.dlron.us/inventoryphotos")
    );

    // De-dupe while preserving order
    images = [...new Set(images)];

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No inventory photos found." },
        { status: 404 }
      );
    }

    // Ensure exactly 4 images by recycling if needed
    while (images.length < 4) {
      images.push(images[images.length - 1]);
    }

    images = images.slice(0, 4);

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
      { error: "Vehicle lookup failed." },
      { status: 500 }
    );
  }
}
