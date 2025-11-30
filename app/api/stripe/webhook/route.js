import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/app/firebase";
import { doc, updateDoc } from "firebase/firestore";

// IMPORTANT:
// STRIPE_WEBHOOK_SECRET must be stored securely later
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    // Verify event came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  const data = event.data.object;

  // Extract UID from metadata (we attached it in checkout)
  const uid = data?.metadata?.uid;

  // No UID → nothing to update
  if (!uid) {
    return NextResponse.json({ received: true });
  }

  const userRef = doc(db, "users", uid);

  try {
    switch (event.type) {
      // ===========================
      // SUCCESSFUL SUBSCRIPTIONS
      // ===========================
      case "checkout.session.completed":
      case "invoice.payment_succeeded":
        await updateDoc(userRef, {
          subscriptionActive: true,
          subscriptionSource: "stripe",
          cancelAtPeriodEnd: false,
        });
        break;

      // ===========================
      // FAILED PAYMENTS
      // ===========================
      case "invoice.payment_failed":
        await updateDoc(userRef, {
          subscriptionActive: false,
          subscriptionSource: "stripe-failed",
        });
        break;

      // ===========================
      // CANCELED SUBSCRIPTION
      // ===========================
      case "customer.subscription.deleted":
        await updateDoc(userRef, {
          subscriptionActive: false,
          subscriptionSource: "stripe-canceled",
        });
        break;

      default:
        // ignore all other events
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Firestore update error: ${err.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
