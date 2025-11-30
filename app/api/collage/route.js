import sharp from "sharp";

// Helper: Load an image buffer from a URL
async function fetchImageBuffer(url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request) {
  try {
    const {
      images,
      ribbon,
      logo,
      description,
      ymm,
      disclosure,
    } = await request.json();

    if (!images || images.length < 1) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
      });
    }

    // ======================================================================
    // 1. LOAD VEHICLE IMAGES
    // ======================================================================
    const buffers = [];
    for (let i = 0; i < Math.min(images.length, 4); i++) {
      try {
        buffers.push(await fetchImageBuffer(images[i]));
      } catch {
        // Skip bad images
      }
    }

    if (buffers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not load any vehicle images." }),
        { status: 400 }
      );
    }

    // ======================================================================
    // 2. BUILD 2×2 COLLAGE GRID (850×850 final)
    // ======================================================================
    const size = 850;
    const half = size / 2;

    const resized = await Promise.all(
      buffers.map((buf) =>
        sharp(buf)
          .resize(half, half, { fit: "cover" })
          .toBuffer()
      )
    );

    // Transparent canvas
    let collage = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      },
    }).png();

    const composites = [];

    // Top-left
    if (resized[0])
      composites.push({ input: resized[0], top: 0, left: 0 });

    // Top-right
    if (resized[1])
      composites.push({ input: resized[1], top: 0, left: half });

    // Bottom-left
    if (resized[2])
      composites.push({ input: resized[2], top: half, left: 0 });

    // Bottom-right
    if (resized[3])
      composites.push({ input: resized[3], top: half, left: half });

    collage = collage.composite(composites);

    // ======================================================================
    // 3. ADD SEASONAL RIBBON (simple colored bar)
    // ======================================================================
    const ribbonColors = {
      christmas: "#c1121f",
      newyear: "#003049",
      "4thofjuly": "#002868",
      thanksgiving: "#964B00",
      memorial: "#0b5394",
      labor: "#3c3c3c",
      winter: "#1e3a8a",
      spring: "#15803d",
      summer: "#ca8a04",
      fall: "#9a3412",
    };

    const ribbonColor = ribbonColors[ribbon] || "#1e3a8a";

    const ribbonBar = await sharp({
      create: {
        width: size,
        height: 110,
        channels: 4,
        background: ribbonColor,
      },
    })
      .png()
      .toBuffer();

    collage = collage.composite([{ input: ribbonBar, top: half - 55, left: 0 }]);

    // ======================================================================
    // 4. ADD DEALER LOGO
    // ======================================================================
    if (logo) {
      try {
        const logoBuf = await fetchImageBuffer(logo);
        const logoResized = await sharp(logoBuf).resize(120, 120).toBuffer();

        collage = collage.composite([
          {
            input: logoResized,
            top: 10,
            left: size - 135,
          },
        ]);
      } catch {
        // Logo failed, ignore
      }
    }

    // ======================================================================
    // 5. ADD TEXT: YMM, DESCRIPTION, DISCLOSURE
    // ======================================================================

    const svgText = `
      <svg width="${size}" height="${size}">
        
        <!-- YMM -->
        <text
          x="30"
          y="40"
          font-size="38"
          fill="white"
          font-weight="bold"
          font-family="Arial, sans-serif"
        >${ymm}</text>

        <!-- Description -->
        <foreignObject x="30" y="80" width="${size - 60}" height="120">
          <div xmlns="http://www.w3.org/1999/xhtml"
            style="font-size: 26px; color: white; font-family: Arial; line-height: 1.25;">
            ${description.replace(/</g, "&lt;")}
          </div>
        </foreignObject>

        <!-- Disclosure -->
        <foreignObject x="30" y="${size - 120}" width="${size - 60}" height="120">
          <div xmlns="http://www.w3.org/1999/xhtml"
            style="font-size: 20px; color: white; font-family: Arial; opacity: 0.9;">
            ${disclosure.replace(/</g, "&lt;")}
          </div>
        </foreignObject>

      </svg>
    `;

    const textOverlay = await sharp(Buffer.from(svgText))
      .png()
      .toBuffer();

    collage = collage.composite([{ input: textOverlay, top: 0, left: 0 }]);

    // ======================================================================
    // 6. RETURN IMAGE BUFFER
    // ======================================================================
    const output = await collage.png().toBuffer();

    return new Response(output, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
