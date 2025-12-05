export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";

// ADMIN FIREBASE ONLY — SAFE FOR SERVER
import { adminDB } from "@/lib/firebaseAdmin";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Stripe sends raw body, not JSON
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
    // Only handle successful subscription creation
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const uid = session.metadata?.uid;

      if (!uid) {
        return new NextResponse("Missing UID metadata", { status: 400 });
      }

      // Update Firestore via admin SDK
      await adminDB.collection("users").doc(uid).set(
        {
          subscribed: true,
          lastUpdated: Date.now()
        },
        { merge: true }
      );
    }

    return new NextResponse("Webhook received", { status: 200 });
  } catch (err) {
    return new NextResponse(`Server error: ${err.message}`, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Stripe webhook endpoint active" });
}
