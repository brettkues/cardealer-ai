import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

// Prevent edge runtime — requires Node.js
export const runtime = "nodejs";

export async function POST(req) {
  try {
    const data = await req.arrayBuffer();
    const pdfText = await pdfParse(Buffer.from(data));

    return NextResponse.json({
      text: pdfText.text || ""
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "PDF reader API active" });
}
