import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { caption, ymm } = await req.json();

    if (!caption || !ymm) {
      return NextResponse.json({ error: "Missing caption or YMM" }, { status: 400 });
    }

    // Detect holiday/season/sale type
    const prompt = `
    Caption: "${caption}"
    Vehicle: "${ymm}"

    1. Identify if caption implies:
       - Holiday theme
       - Seasonal theme (winter/spring/summer/fall)
       - Sale/promo theme
       - Generic theme

    2. Based on the theme, return:
       - "ribbonTheme": one of ["holiday", "winter", "spring", "summer", "fall", "sale", "generic"]
       - "shortRibbonText": A short 3–6 word phrase fitting the theme.
    `;

    const themeResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const parsed = JSON.parse(themeResponse.choices[0].message.content);
    const { ribbonTheme, shortRibbonText } = parsed;

    return NextResponse.json({
      ribbonTheme,
      shortRibbonText,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Ribbon AI failed", details: err.message },
      { status: 500 }
    );
  }
}
