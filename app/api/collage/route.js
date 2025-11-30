import sharp from "sharp";

/**
 * Helper: Auto Season Ribbon
 */
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

/**
 * Helper: Extract Year/Make/Model from description or URL
 */
function extractYMM(description, url) {
  try {
    // First attempt: URL pattern "2023-Nissan-Altima"
    const urlParts = url.split("/");
    const last = urlParts[urlParts.length - 1];
    const segments = last.replace(/-/g, " ").split(" ");

    const year = segments.find((x) => /^\d{4}$/.test(x));
    const make = segments[segments.indexOf(year) + 1];
    const model = segments.slice(segments.indexOf(make) + 1, segments.indexOf(make) + 3).join(" ");

    if (year && make && model) {
      return `${year} ${make} ${model}`;
    }

    // Second attempt: description-based fallback
    const match = description.match(/(20\d{2})\s+([A-Za-z]+)\s+([A-Za-z0-9]+)/);
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
    }

    return "Vehicle";
  } catch {
    return "Vehicle";
  }
}

/**
 * Helper: Generate Disclosure
 */
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

  // Base WI fallback language
  const wiDisclosure =
    "All offers subject to tax, title, license & fees. See dealer for details.";

  if (laws.type === "text") {
    // We could parse the text someday; for now we return the concise WI-safe disclosure.
    return wiDisclosure;
  }

  return wiDisclosure;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const { images, description, season, logoUrl, laws, url } = body;

    if (!images || images.length !== 4) {
      return new Response(JSON.stringify({ error: "4 images required" }), {
        status: 400,
      });
    }

    // -----------------------------------------------------
    // FETCH IMAGE BUFFERS
    // -----------------------------------------------------
    const buffers = await Promise.all(
      images.map(async (img) => {
        const res = await fetch(img);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    // -----------------------------------------------------
    // RESIZE EACH VEHICLE IMAGE INTO 800×800
    // -----------------------------------------------------
    const resized = await Promise.all(
      buffers.map((buf) =>
        sharp(buf).resize(800, 800, { fit: "cover" }).toBuffer()
      )
    );

    // -----------------------------------------------------
    // CANVAS 1600×1600
    // -----------------------------------------------------
    const canvas = sharp({
      create: {
        width: 1600,
        height: 1600,
        channels: 3,
        background: "#FFFFFF",
      },
    });

    // -----------------------------------------------------
    // AUTO SEASON RIBBON COLOR
    // -----------------------------------------------------
    const ribbonColor = getSeasonAssets(season);

    const ribbon = {
      create: {
        width: 1600,
        height: 200,
        channels: 3,
        background: ribbonColor,
      },
    };

    const ribbonBuffer = await sharp(ribbon).png().toBuffer();

    // -----------------------------------------------------
    // GENERATE DISCLOSURE
    // -----------------------------------------------------
    const disclosure = generateDisclosure(description, laws);

    // -----------------------------------------------------
    // EXTRACT YMM
    // -----------------------------------------------------
    const ymm = extractYMM(description, url);

    // -----------------------------------------------------
    // LOAD LOGO (if exists)
    // -----------------------------------------------------
    let logoBuffer = null;

    if (logoUrl) {
      try {
        const logoRes = await fetch(logoUrl);
        const logoArr = await logoRes.arrayBuffer();
        logoBuffer = await sharp(Buffer.from(logoArr))
          .resize(180, 180, { fit: "contain" })
          .png()
          .toBuffer();
      } catch (err) {
        logoBuffer = null;
      }
    }

    // -----------------------------------------------------
    // COMPOSITE EVERYTHING
    // -----------------------------------------------------
    let composite = canvas.composite([
      // Quadrants
      { input: resized[0], top: 0, left: 0 },
      { input: resized[1], top: 0, left: 800 },
      { input: resized[2], top: 800, left: 0 },
      { input: resized[3], top: 800, left: 800 },

      // Ribbon
      { input: ribbonBuffer, top: 700, left: 0 },
    ]);

    // -----------------------------------------------------
    // Logo (left of ribbon)
    // -----------------------------------------------------
    if (logoBuffer) {
      composite = composite.composite([
        { input: logoBuffer, top: 710, left: 40 },
      ]);
    }

    // -----------------------------------------------------
    // Add YMM + description text
    // -----------------------------------------------------
    composite = composite.png();

    const temp = await composite.toBuffer();

    // -----------------------------------------------------
    // ADD TEXT USING SHARP SVG OVERLAY
    // -----------------------------------------------------
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

    // -----------------------------------------------------
    // RETURN IMAGE
    // -----------------------------------------------------
    return new Response(finalImage, {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
