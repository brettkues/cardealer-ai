export const runtime = "edge"; 
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("No PDF URL provided", { status: 400 });
    }

    // Fetch PDF as plain binary
    const res = await fetch(url);
    if (!res.ok) {
      return new Response("Failed to fetch PDF", { status: 500 });
    }

    const text = await extractTextFallback(res);

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// ------------------------------
// SIMPLE FALLBACK PDF "EXTRACTOR"
// ------------------------------
async function extractTextFallback(res) {
  // This gets SOME text from many PDFs
  // It is lightweight + Vercel compatible
  const buffer = new Uint8Array(await res.arrayBuffer());
  const text = new TextDecoder("utf-8").decode(buffer);

  return text || "Unable to extract text from PDF.";
}
