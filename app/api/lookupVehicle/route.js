import { NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Vehicle URL is required." },
        { status: 400 }
      );
    }

    const res = await fetch(url, { method: "GET" }).catch(() => null);
    if (!res || !res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch vehicle page." },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    // --------------------------
    // TRY 1 — DealerOn NEXT_DATA
    // --------------------------
    const nextDataTag = root.querySelector("#__NEXT_DATA__");

    let images = [];

    if (nextDataTag) {
      try {
        const json = JSON.parse(nextDataTag.innerText);

        // Locate all keys containing media or gallery
        const walk = (obj) => {
          if (!obj || typeof obj !== "object") return;

          for (const key of Object.keys(obj)) {
            const val = obj[key];

            if (
              key.toLowerCase().includes("media") ||
              key.toLowerCase().includes("gallery")
            ) {
              if (Array.isArray(val)) {
                val.forEach((v) => {
                  if (typeof v === "string" && v.startsWith("http")) {
                    images.push(v);
                  }
                  if (v && v.url && v.url.startsWith("http")) {
                    images.push(v.url);
                  }
                });
              }
            }

            walk(val);
          }
        };

        walk(json);

        images = [...new Set(images)].slice(0, 4); // unique, limit 4
      } catch (e) {
        console.log("DealerOn NEXT_DATA parse failed", e);
      }
    }

    // --------------------------
    // FALLBACK — scan <img> tags
    // --------------------------
    if (images.length === 0) {
      root.querySelectorAll("img").forEach((img) => {
        const src =
          img.getAttribute("data-src") ||
          img.getAttribute("src") ||
          "";

        if (src.startsWith("http") && !src.includes("logo") && images.length < 4) {
          images.push(src);
        }
      });
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Could not extract vehicle images" },
        { status: 404 }
      );
    }

    // --------------------------
    // Extract basic vehicle info
    // --------------------------
    const title = root.querySelector("title")?.innerText || "";

    const year = title.match(/\b(19|20)\d{2}\b/)?.[0] || "";
    const make = title.split(" ")[1] || "";
    const model = title.split(" ").slice(2).join(" ").split("-")[0];

    return NextResponse.json({
      vehicle: { year, make, model, url },
      images
    });

  } catch (err) {
    console.log("SCRAPER ERROR:", err);
    return NextResponse.json(
      { error: "Lookup failed." },
      { status: 500 }
    );
  }
}
