import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { images } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided." },
        { status: 400 }
      );
    }

    const firstImage = images[0];

    // If it's already base64, return it
    if (firstImage.startsWith("data:image")) {
      return NextResponse.json({
        images: [firstImage],
      });
    }

    // If it's a URL, just return the URL directly
    if (firstImage.startsWith("http")) {
      return NextResponse.json({
        images: [firstImage],
      });
    }

    return NextResponse.json(
      { error: "Unsupported image format." },
      { status: 400 }
    );
  } catch (err) {
    console.error("BUILD IMAGE ERROR:", err);
    return NextResponse.json(
      { error: "Image build failed." },
      { status: 500 }
    );
  }
}
