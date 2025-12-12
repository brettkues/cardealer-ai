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

    // Fetch the page
    const res = await fetch(cleaned, { method: "GET" }).catch(() => null);
    if (!res || !res.ok) {
      return NextResponse.json(
        { error: "Vehicle page could not be fetched." },
        { status: 500 }
      );
    }

    const html = await res.text();
    const root = parse(html);

    // ---------------------------------------------------------
    // 1. EXTRACT window.digitalData SCRIPT
    // ---------------------------------------------------------
    const scriptTags = root.querySelectorAll("script");

    let digitalDataJSON = null;

    for (const tag of scriptTags) {
      const content = tag.innerText;

      if (content && content.includes("window.digitalData")) {
        // Extract JSON between the = and the ending semicolon
        const match = content.match(/window\.digitalData\s*=\s*(\{[\s\S]*?\});/);

        if (match && match[1]) {
          try {
            digitalDataJSON = JSON.parse(match[1]);
          } catch (err) {
            // Some DealerOn versions put trailing commas
            const fixed = match[1].replace(/,(\s*[}\]])/g, "$1");
            try {
              digitalDataJSON = JSON.parse(fixed);
            } catch (e) {
              return NextResponse.json(
                { error: "Could not parse vehicle data." },
                { status: 500 }
              );
            }
          }
        }
      }
    }

    if (!digitalDataJSON) {
      return NextResponse.json(
        { error: "Vehicle data not found on page." },
        { status: 404 }
      );
    }

    const vehicleNode = digitalDataJSON.vehicle || {};

    // ---------------------------------------------------------
    // 2. EXTRACT IMAGES
    // ---------------------------------------------------------
    let images = [];

    if (vehicleNode.media && Array.isArray(vehicleNode.media)) {
      images = vehicleNode.media
        .filter((m) => m.url && m.url.startsWith("http"))
        .map((m) => m.url)
        .slice(0, 4);
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Could not extract vehicle images." },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // 3. EXTRACT VEHICLE DETAILS
    // ---------------------------------------------------------
    const vehicle = {
      year: vehicleNode.year || "",
      make: vehicleNode.make || "",
      model: vehicleNode.model || "",
      trim: vehicleNode.trim || "",
      vin: vehicleNode.vin || "",
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
