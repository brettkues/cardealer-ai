import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { stock } = await req.json();

    if (!stock) {
      return NextResponse.json({ message: "No stock number provided." });
    }

    // Placeholder — actual scraper + collage logic added later
    return NextResponse.json({
      message: `Preview generation started for stock/VIN: ${stock}`,
    });

  } catch (err) {
    return NextResponse.json(
      { message: "Error generating image." },
      { status: 500 }
    );
  }
}
