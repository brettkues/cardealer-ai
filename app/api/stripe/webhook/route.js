export const runtime = "nodejs";          // Stripe requires Node runtime
export const dynamic = "force-dynamic";   // Prevent static optimization
export const maxDuration = 60;            // Prevent Vercel timeout

import Stripe from "stripe";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// -------------------------------
// Initialize Firebase Admin
// -------------------------------
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

const adminDb = getFirestore();

// -------------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  // Stripe requires RAW BODY, so we must read it as text:
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
      { status: 400 }
    );
  }

  const data = event.data.object;
  const uid = data?.metadata?.uid;

  if (!uid) {
    return new Response(JSON.stringify({ received: true }));
  }

  const userRef = adminDb.collection("users").doc(uid);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "invoice.payment_succeeded":
        await userRef.update({
          subscriptionActive: true,
          subscriptionSource: "stripe",
          cancelAtPeriodEnd: false,
        });
        break;

      case "invoice.payment_failed":
        await userRef.update({
          subscriptionActive: false,
          subscriptionSource: "stripe-failed",
        });
        break;

      case "customer.subscription.deleted":
        await userRef.update({
          subscriptionActive: false,
          subscriptionSource: "stripe-canceled",
        });
        break;

      default:
        break;
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Firestore update error: ${err.message}` }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
