export const runtime = "nodejs";          // REQUIRED for Stripe
export const dynamic = "force-dynamic";   // Prevent static optimization
export const maxDuration = 60;            // Prevent timeout

import Stripe from "stripe";
import { corsHeaders, handleCors } from "@/app/utils/cors";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// -----------------------------
// Initialize Firebase Admin
// -----------------------------
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

const adminDb = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { uid } = await request.json();

    if (!uid) {
      return new Response(JSON.stringify({ error: "Missing UID." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // -----------------------------
    // LOAD USER FROM FIRESTORE
    // -----------------------------
    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404,
        headers: corsHeaders(),
      });
    }

    const data = snap.data();

    if (!data.stripeCustomerId) {
      return new Response(
        JSON.stringify({
          error:
            "No Stripe customer found. You must activate a subscription first.",
        }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // -----------------------------
    // CREATE BILLING PORTAL SESSION
    // -----------------------------
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: data.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: corsHeaders(),
    });

  } catch (err) {
    console.error("Billing portal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
