import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url, text } = await req.json();

    return NextResponse.json({
      image: "https://via.placeholder.com/850x850.png?text=Collage+Preview",
      usedUrl: url,
      usedText: text,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate collage" },
      { status: 500 }
    );
  }
}
