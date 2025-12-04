export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import sharp from "sharp";
import { corsHeaders, handleCors } from "../../utils/cors";

// ------------------------------------------------------------
// SEASON COLORS
// ------------------------------------------------------------
function getSeasonAssets(season) {
  const seasonMap = {
    christmas: "#C00000",
    thanksgiving: "#8B4513",
    halloween: "#FF6A00",
    fall: "#B5651D",
    summer: "#1A73E8",
    july4: "#002868",
    memorial: "#002F6C",
    spring: "#009966",
    winter: "#3366CC",
    newyear: "#111111",
    generic: "#333333",
  };
  return seasonMap[season] || "#333333";
}

// ------------------------------------------------------------
// EXTRACT YEAR/MAKE/MODEL FROM DESCRIPTION OR URL
// ------------------------------------------------------------
function extractYMM(description, url) {
  try {
    const urlParts = url.split("/");
    const last = urlParts[urlParts.length - 1];
    const segments = last.replace(/-/g, " ").split(" ");

    const year = segments.find((x) => /^\d{4}$/.test(x));
    const make = segments[segments.indexOf(year) + 1];
    const model = segments
      .slice(segments.indexOf(make) + 1, segments.indexOf(make) + 3)
      .join(" ");

    if (year && make && model) return `${year} ${make} ${model}`;

    const match = description.match(/(20\d{2})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);
    if (match) return `${match[1]} ${match[2]} ${match[3]}`;

    return "Vehicle";
  } catch {
    return "Vehicle";
  }
}

// ------------------------------------------------------------
// AUTOMATIC DISCLOSURE GENERATION
// ------------------------------------------------------------
function generateDisclosure(description) {
  const triggers = {
    price: /\$[\d,]+/i,
    apr: /\b\d+(\.\d+)?%\b/i,
    payment: /\b\d+\s*\/\s*mo\b/i,
  };

  let items = [];

  if (triggers.price.test(description)) items.push("price");
  if (triggers.apr.test(description)) items.push("APR");
  if (triggers.payment.test(description)) items.push("payment");

  if (items.length === 0) {
    return "See dealer for details.";
  }

  return "All offers subject to tax, title, license & fees. See dealer for details.";
}

// ------------------------------------------------------------
// ROUTE: POST
// ------------------------------------------------------------
export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const body = await request.json();
    const { images, description, season, logoUrl, laws, url } = body;

    // Validate images
    if (!images || images.length !== 4) {
      return new Response(JSON.stringify({ error: "4 images required" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // ------------------------------------------------------------
    // Download vehicle images
    // ------------------------------------------------------------
    const buffers = await Promise.all(
      images.map(async (img) => {
        const res = await fetch(img);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    const resized = await Promise.all(
      buffers.map((buf) =>
        sharp(buf).resize(800, 800, { fit: "cover" }).toBuffer()
      )
    );

    // ------------------------------------------------------------
    // Create base canvas
    // ------------------------------------------------------------
    const canvas = sharp({
      create: {
        width: 1600,
        height: 1600,
        channels: 3,
        background: "#FFFFFF",
      },
    });

    // ------------------------------------------------------------
    // Create ribbon
    // ------------------------------------------------------------
    const ribbonColor = getSeasonAssets(season);
    const ribbon = await sharp({
      create: {
        width: 1600,
        height: 200,
        channels: 3,
        background: ribbonColor,
      },
    })
      .png()
      .toBuffer();

    // ------------------------------------------------------------
    // Logo fetch (optional)
    // ------------------------------------------------------------
    let logoBuffer = null;

    if (logoUrl) {
      try {
        const logoRes = await fetch(logoUrl);
        const arr = await logoRes.arrayBuffer();
        logoBuffer = Buffer.from(arr);
      } catch {
        logoBuffer = null; // continue without logo
      }
    }

    // ------------------------------------------------------------
    // Auto-text
    // ------------------------------------------------------------
    const disclosure = generateDisclosure(description);
    const ymm = extractYMM(description, url);

    // ------------------------------------------------------------
    // Compose everything
    // ------------------------------------------------------------
    let final = await canvas
      .composite([
        { input: resized[0], top: 0, left: 0 },
        { input: resized[1], top: 0, left: 800 },
        { input: resized[2], top: 800, left: 0 },
        { input: resized[3], top: 800, left: 800 },
        { input: ribbon, top: 700, left: 0 },
      ])
      .png()
      .toBuffer();

    // ------------------------------------------------------------
    // Add text + logo with Sharp pipeline
    // ------------------------------------------------------------
    let svgText = `
      <svg width="1600" height="1600">
        <text x="50%" y="760" font-size="48" fill="white" text-anchor="middle" font-family="Arial" font-weight="bold">
          ${ymm}
        </text>

        <text x="50%" y="820" font-size="32" fill="white" text-anchor="middle" font-family="Arial">
          ${description}
        </text>

        <text x="50%" y="880" font-size="28" fill="white" text-anchor="middle" font-family="Arial">
          ${disclosure}
        </text>
      </svg>
    `;

    final = await sharp(final)
      .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
      .png()
      .toBuffer();

    // Logo overlay
    if (logoBuffer) {
      final = await sharp(final)
        .composite([{ input: logoBuffer, top: 710, left: 40 }])
        .png()
        .toBuffer();
    }

    // ------------------------------------------------------------
    // Successful response
    // ------------------------------------------------------------
    return new Response(final, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
