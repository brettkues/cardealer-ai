import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { collageUrl } = await req.json();

    if (!collageUrl) {
      return NextResponse.json(
        { error: "Missing collage URL." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Collage finalized.",
      url: collageUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to finalize image." },
      { status: 500 }
    );
  }
}
