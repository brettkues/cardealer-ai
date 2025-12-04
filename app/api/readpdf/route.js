export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pdf from "pdf-parse";

// Fetch PDF as ArrayBuffer / Buffer
async function fetchPdfBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Unable to fetch PDF");
  return Buffer.from(await res.arrayBuffer());
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("No PDF URL provided", { status: 400 });
    }

    // Fetch & parse PDF text
    const buffer = await fetchPdfBuffer(url);
    const data = await pdf(buffer);

    return new Response(data.text, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
