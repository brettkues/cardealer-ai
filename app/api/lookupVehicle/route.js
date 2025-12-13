import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchImageAsBase64(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "image/*",
    },
  });

  if (!res.ok) throw new Error("Image fetch blocked");

  const buffer = await res.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`;
}

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Invalid or missing vehicle URL" },
        { status: 400 }
      );
    }

    // 🔧 YOU ALREADY HAVE SCRAPING LOGIC HERE
    // This example assumes you already extract image URLs into `imageUrls`

    const imageUrls = await scrapeListingImages(url); // ← your existing logic

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "No vehicle images found" },
        { status: 400 }
      );
    }

    // 🔑 DOWNLOAD IMAGES SERVER-SIDE
    const images = [];
    for (const imgUrl of imageUrls.slice(0, 4)) {
      try {
        const base64 = await fetchImageAsBase64(imgUrl);
        images.push(base64);
      } catch {
        // skip blocked images
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Vehicle images blocked by host" },
        { status: 400 }
      );
    }

    return NextResponse.json({ images });
  } catch (err) {
    console.error("LOOKUP ERROR:", err);
    return NextResponse.json(
      { error: "Vehicle lookup failed" },
      { status: 500 }
    );
  }
}
