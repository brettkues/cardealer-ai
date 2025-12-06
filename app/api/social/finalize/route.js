import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { images, ribbonText, logos, caption } = await req.json();

    if (!images || !images.length) {
      return NextResponse.json(
        { message: "No images provided." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Final image generation request accepted.",
        details: {
          images,
          ribbonText,
          logos,
          caption,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Error finalizing image." },
      { status: 500 }
    );
  }
}
