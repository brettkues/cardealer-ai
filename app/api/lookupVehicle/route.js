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
    // FETCH THE PAGE
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
    // VEHICLE DATA: YEAR / MAKE / MODEL / TRIM / VIN
    // --------------------------------------------------
    let year = "";
    let make = "";
    let model = "";
    let trim = "";
    let vin = "";

    // DealerOn "dataLayer" object
    const dlScript = root
      .querySelectorAll("script")
      .find((s) => s.innerText.includes("vehicleYear"));

    if (dlScript) {
      try {
        const match = dlScript.innerText.match(/vehicleYear":"(\d{4})"/);
        if (match) year = match[1];

        const mk = dlScript.innerText.match(/vehicleMake":"([^"]+)"/);
        if (mk) make = mk[1];

        const md = dlScript.innerText.match(/vehicleModel":"([^"]+)"/);
        if (md) model = md[1];

        const tr = dlScript.innerText.match(/vehicleTrim":"([^"]+)"/);
        if (tr) trim = tr[1];

        const vn = dlScript.innerText.match(/vehicleVin":"([^"]+)"/);
        if (vn) vin = vn[1];
      } catch {}
    }

    // If missing, try <title>
    if (!year || !make || !model) {
      const title = root.querySelector("title")?.innerText || "";
      const match = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);
      if (match) {
        year = year || match[1];
        make = make || match[2];
        model = model || match[3];
      }
    }

    // --------------------------------------------------
    // EXTRACT IMAGES (DealerOn, Dealer.com, Dealer Inspire)
    // --------------------------------------------------
    let images = [];

    // 1️⃣ JSON-LD image arrays
    const ldTags = root.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    for (const tag of ldTags) {
      try {
        const json = JSON.parse(tag.innerText);

        if (json.image) {
          if (Array.isArray(json.image)) {
            images = json.image.slice(0, 4);
            break;
          }
          if (typeof json.image === "string") {
            images = [json.image];
            break;
          }
        }
      } catch {}
    }

    // 2️⃣ DealerOn uses thumbnails with data-src or src
    if (images.length === 0) {
      const imgTags = root.querySelectorAll("img");

      imgTags.forEach((img) => {
        const src =
          img.getAttribute("data-src") ||
          img.getAttribute("data-lazy") ||
          img.getAttribute("src");

        if (!src) return;
        if (!src.startsWith("http")) return;

        // remove icons, badges, pixel trackers
        if (src.includes("icon")) return;
        if (src.includes("thumb")) return;
        if (src.includes("badge")) return;
        if (src.includes("placeholder")) return;

        if (images.length < 4) images.push(src);
      });
    }

    // 3️⃣ Dealer Inspire uses <picture> sets
    if (images.length === 0) {
      const pic = root.querySelectorAll("picture source");
      pic.forEach((p) => {
        const src = p.getAttribute("srcset");
        if (src && src.startsWith("http") && images.length < 4) {
          images.push(src);
        }
      });
    }

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
