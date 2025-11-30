import sharp from "sharp";
import { corsHeaders, handleCors } from "@/app/utils/cors";

// -------------------------------------------
// SEASON → RIBBON COLOR
// -------------------------------------------
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

// -------------------------------------------
// Extract Year/Make/Model
// -------------------------------------------
function extractYMM(description, url) {
  try {
    const urlParts = url.split("/");
    const last = urlParts[urlParts.length - 1];
    const segments = last.replace(/-/g, " ").split(" ");

    const year = segments.find((x) => /^\d{4}$/.test(x));
    const make = segments[segments.indexOf(year) + 1];
    const model = segments.slice(segments.indexOf(make) + 1, segments.indexOf(make) + 3).join(" ");

    if (year && make && model) return `${year} ${make} ${model}`;

    const match = description.match(/(20\d{2})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);
    if (match) return `${match[1]} ${match[2]} ${match[3]}`;

    return "Vehicle";
  } catch {
    return "Vehicle";
  }
}

// -------------------------------------------
// Disclosure
// -------------------------------------------
function generateDisclosure(description, laws) {
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

  const wiDisclosure =
    "All offers subject to tax, title, license & fees. See dealer for details.";

  if (laws.type === "text") return wiDisclosure;

  return wiDisclosure;
}

export async function POST(request) {
  // CORS preflight
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const body = await request.json();
    const { images, description, season, logoUrl, laws, url } = body;

    if (!images || images.length !== 4) {
      return new Response(JSON.stringify({ error: "4 images required" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Load vehicle images
    const buffers = await Promise.all(
      images.map(async (img) => {
        const res = await fetch(img);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    // Resize to quadrants
    const resized = await Promise.all(
      buffers.map((buf) =>
        sharp(buf).resize(800, 800, { fit: "cover" }).toBuffer()
      )
    );

    // Base canvas 1600x1600
    const canvas = sharp({
      create: {
        width: 1600,
        height: 1600,
        channels: 3,
        background: "#FFFFFF",
      },
    });

    // Ribbon
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

    // Disclosure
    const disclosure = generateDisclosure(description, laws);

    // YMM
    const ymm = extractYMM(description, url);

    // Logo load
    let logoBuffer = null;
    if (logoUrl) {
      try {
        const logoRes = await fetch(logoUrl);
        logoBuffer = await sharp(Buffer.from(await logoRes.arrayBuffer()))
          .resize(180, 180, { fit: "contain" })
          .png()
          .toBuffer();
      } catch {
        logoBuffer = null;
      }
    }

    // Composite layers
    let composite = canvas.composite([
      { input: resized[0], top: 0, left: 0 },
      { input: resized[1], top: 0, left: 800 },
      { input: resized[2], top: 800, left: 0 },
      { input: resized[3], top: 800, left: 800 },
      { input: ribbon, top: 700, left: 0 },
    ]);

    if (logoBuffer) {
      composite = composite.composite([{ input: logoBuffer, top: 710, left: 40 }]);
    }

    const temp = await composite.png().toBuffer();

    // Add SVG text overlay
    const svg = `
      <svg width="1600" height="1600">
        <style>
          .ymm { fill: white; font-size: 70px; font-weight: bold; font-family: sans-serif; }
          .desc { fill: white; font-size: 34px; font-family: sans-serif; }
          .disc { fill: black; font-size: 28px; font-family: sans-serif; }
        </style>

        <rect x="0" y="1500" width="1600" height="100" fill="white"/>
        <text x="30" y="1560" class="disc">${disclosure}</text>

        <text x="250" y="780" class="ymm">${ymm}</text>
        <text x="250" y="840" class="desc">${description.slice(0, 90)}...</text>
      </svg>
    `;

    const finalImage = await sharp(temp)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return new Response(finalImage, {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "image/png",
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
