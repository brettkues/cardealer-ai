export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Required worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "pdfjs-dist/legacy/build/pdf.worker.js";

// Fetch PDF as buffer
async function fetchPdfBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Unable to fetch PDF");
  return new Uint8Array(await res.arrayBuffer());
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("No PDF URL provided", { status: 400 });
    }

    // Load PDF
    const data = await fetchPdfBuffer(url);
    const pdf = await pdfjsLib.getDocument({ data }).promise;

    let fullText = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const pageText = content.items
        .map((item) => item.str)
        .join(" ");

      fullText += pageText + "\n\n";
    }

    return new Response(fullText, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    return new Response(`Error reading PDF: ${err.message}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
