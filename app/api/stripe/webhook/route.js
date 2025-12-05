export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  try {
    // Handle subscription completion
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.metadata?.uid;

      if (!uid) {
        return new NextResponse("Missing UID metadata", { status: 400 });
      }

      // Write subscription status using firebase-admin
      await adminDB.collection("users").doc(uid).set(
        {
          subscribed: true,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    }

    return new NextResponse("Received", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse(`Server error: ${err.message}`, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Stripe webhook endpoint active" });
}
