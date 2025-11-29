import sharp from "sharp";

export async function POST(request) {
  try {
    const { images, ribbon, logo, text } = await request.json();

    if (!images || images.length !== 4) {
      return new Response(JSON.stringify({ error: "Exactly 4 images required." }), {
        status: 400,
      });
    }

    // Fetch all 4 images
    const buffers = await Promise.all(
      images.map(async (url) => {
        const res = await fetch(url);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    // Create a 1600x1600 canvas (square Facebook friendly)
    const canvas = sharp({
      create: {
        width: 1600,
        height: 1600,
        channels: 3,
        background: "#ffffff"
      }
    });

    // Resize images to fit quadrants
    const resized = await Promise.all(
      buffers.map((buf) =>
        sharp(buf)
          .resize(800, 800, { fit: "cover" })
          .toBuffer()
      )
    );

    // Composite images (quadrants)
    const composite = await canvas
      .composite([
        { input: resized[0], top: 0, left: 0 },
        { input: resized[1], top: 0, left: 800 },
        { input: resized[2], top: 800, left: 0 },
        { input: resized[3], top: 800, left: 800 }
      ])
      .png()
      .toBuffer();

    return new Response(composite, {
      status: 200,
      headers: { "Content-Type": "image/png" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
