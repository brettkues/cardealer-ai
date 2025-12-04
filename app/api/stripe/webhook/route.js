export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextResponse } from "next/server";

import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  try {
    // Handle subscription creation
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const uid = session.metadata?.uid;
      if (!uid) {
        return new NextResponse("Missing UID in metadata", { status: 400 });
      }

      await setDoc(
        doc(db, "users", uid),
        {
          subscribed: true,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    }

    return new NextResponse("Received", { status: 200 });
  } catch (err) {
    return new NextResponse(`Server error: ${err.message}`, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Stripe webhook endpoint active" });
}
