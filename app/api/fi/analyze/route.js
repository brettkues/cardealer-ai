import { NextResponse } from "next/server";
import { runChat } from "../../../../lib/ai/openai";
import { adminStorage } from "../../../../lib/firebaseAdmin";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json({ analysis: "No file uploaded." });
    }

    // Read PDF
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract PDF text using pdf-parse
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text || "";

    // Send extracted text to F&I AI
    const messages = [
      {
        role: "system",
        content:
          "You are a professional F&I Manager performing a deal compliance and fundability review. Provide a FULL breakdown:\n\n- Missing signatures\n- Missing initials\n- Compliance issues\n- Funding concerns\n- Identity mismatches\n- Insurance issues\n- Lender-specific requirements\n- Document inconsistencies\n- Contract structure concerns\n- Next steps\n\nDo NOT calculate payments or quote rates. Be precise, compliance-focused, and dealership-correct."
      },
      {
        role: "user",
        content: `Here is the extracted deal text:\n\n${extractedText}`
      }
    ];

    const analysis = await runChat("gpt-4o-mini", messages);

    return NextResponse.json({ analysis });
  } catch (err) {
    return NextResponse.json({ analysis: "Error analyzing deal." });
  }
}
