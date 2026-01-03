import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Reliable PDF extraction using pdf-parse and unpdf as fallback
export async function extractPdfText(buffer) {
  let text = "";

  // 1. Try pdf-parse first
  try {
    const pdfParse = require("pdf-parse"); // CommonJS module
    const result = await pdfParse(buffer);
    text = result.text || "";
  } catch (err) {
    text = "";
  }

  // 2. Fallback to unpdf if needed
  if (!text || text.trim().length === 0) {
    try {
      const { getDocumentProxy, extractText } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text: unpdfText } = await extractText(pdf, { mergePages: true });
      text = unpdfText || "";
    } catch (err) {
      text = "";
    }
  }

  // 3. Final fallback — consider OCR later if still no text
  if (!text || text.trim().length === 0) {
    console.warn("⚠️ No text extracted — scanned PDF or unsupported format.");
  }

  return text;
}
