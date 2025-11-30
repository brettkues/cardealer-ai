import { PDFDocument } from "pdf-lib";

// Utility: Fetch a PDF as ArrayBuffer
async function fetchPdfBuffer(url) {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return arrayBuffer;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return new Response("No PDF URL provided", { status: 400 });
    }

    // Load PDF
    const pdfBuffer = await fetchPdfBuffer(url);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    let fullText = "";

    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const text = await page.getTextContent?.();
      if (text && text.items) {
        const pageText = text.items.map((i) => i.str).join(" ");
        fullText += pageText + "\n\n";
      }
    }

    return new Response(fullText, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
