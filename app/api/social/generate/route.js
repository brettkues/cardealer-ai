import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "Missing action." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Social generation placeholder.",
      action,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate social output." },
      { status: 500 }
    );
  }
}
