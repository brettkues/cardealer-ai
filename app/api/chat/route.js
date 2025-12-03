import { NextResponse } from "next/server";
import OpenAI from "openai";

// CORRECT FIREBASE IMPORT
import { db } from "@/app/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { uid, userMessage } = await req.json();

    if (!uid || !userMessage) {
      return NextResponse.json(
        { error: "Missing uid or userMessage" },
        { status: 400 }
      );
    }

    // Confirm subscription is active
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = snap.data();

    if (!data.subscriptionActive) {
      return NextResponse.json(
        { error: "Subscription not active" },
        { status: 403 }
      );
    }

    // Send message to OpenAI
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userMessage }],
    });

    const answer = completion.choices?.[0]?.message?.content || "";

    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
