export const runtime = "edge";
export const dynamic = "force-dynamic";

// This version avoids pdfjs, avoids canvas, avoids workers,
// and WILL deploy on Vercel with zero extra dependencies.

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("No PDF URL provided", { status: 400 });
    }

    // Fetch PDF binary
    const res = await fetch(url);
    if (!res.ok) {
      return new Response("Failed to fetch PDF", { status: 500 });
    }

    // Lightweight fallback – extract whatever plain text exists
    const buffer = new Uint8Array(await res.arrayBuffer());
    const text = new TextDecoder("utf-8").decode(buffer);

    const cleaned = text && text.trim().length > 0
      ? text
      : "Unable to extract readable text from PDF.";

    return new Response(cleaned, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
