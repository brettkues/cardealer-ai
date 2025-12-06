import { NextResponse } from "next/server";
import { runChat } from "@/lib/ai/openai";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return NextResponse.json(
        { analysis: "No file uploaded." },
        { status: 200 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text || "";

    const messages = [
      {
        role: "system",
        content:
          "You are a professional F&I Manager reviewing a deal for compliance and fundability. Provide a detailed breakdown:\n\n- Missing signatures\n- Missing initials\n- Compliance issues\n- Funding concerns\n- Identity mismatches\n- Insurance issues\n- Lender-specific requirements\n- Document inconsistencies\n- Contract structure issues\n- Required next steps\n\nDo NOT quote rates or calculate payments."
      },
      {
        role: "user",
        content: `Extracted deal text:\n\n${extractedText}`
      }
    ];

    const analysis = await runChat("gpt-4o-mini", messages);

    return NextResponse.json({ analysis }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { analysis: "Error analyzing deal." },
      { status: 200 }
    );
  }
}
