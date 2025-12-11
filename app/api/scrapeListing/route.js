import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const dynamic = "force-dynamic";

export async function POST(req = new NextRequest()) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    let titleText = root.querySelector("title")?.innerText || "";
    const ogTitle = root
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content");
    if (ogTitle) titleText = ogTitle;

    const ldScripts = root.querySelectorAll(
      'script[type="application/ld+json"]'
    );

    for (const script of ldScripts) {
      try {
        const data = JSON.parse(script.innerText);
        if (
          data["@type"] === "Vehicle" ||
          data["@type"] === "Car" ||
          data["@type"] === "Product"
        ) {
          if (typeof data.name === "string" && data.name.length > 0) {
            titleText = data.name;
            break;
          }
        }
      } catch {}
    }

    let year = "";
    let make = "";
    let model = "";

    if (titleText) {
      const match = titleText.match(
        /^(?<year>\d{4})\s+(?<make>\w+)\s+(?<model>.+)/
      );

      if (match?.groups) {
        ({ year, make, model } = match.groups);
      } else {
        const parts = titleText.split(" ");
        if (parts.length >= 3) {
          year = parts[0];
          make = parts[1];
          model = parts.slice(2).join(" ");
        } else {
          model = titleText;
        }
      }
    }

    const images = [];

    root.querySelectorAll('meta[property="og:image"]').forEach((tag) => {
      const src = tag.getAttribute("content");
      if (src) images.push(src);
    });

    if (images.length === 0) {
      root.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src");
        if (
          src &&
          src.startsWith("http") &&
          !src.toLowerCase().includes("logo") &&
          images.length < 5
        ) {
          images.push(src);
        }
      });
    }

    return NextResponse.json({
      year,
      make,
      model,
      images,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
