export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// Basic text scraper — safe for Vercel, avoids JSDOM during build
export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${res.status}` },
        { status: 500 }
      );
    }

    const html = await res.text();

    // Simple title extraction — expandable later
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "No title found";

    return NextResponse.json({
      success: true,
      title,
      length: html.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
