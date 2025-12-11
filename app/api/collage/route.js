import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url, text, photos } = await req.json();

    return NextResponse.json({
      image: "https://via.placeholder.com/850x850.png?text=Collage+Preview",
      usedUrl: url,
      usedText: text,
      usedPhotos: photos || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Collage error" },
      { status: 500 }
    );
  }
}
