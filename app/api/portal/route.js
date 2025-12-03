export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import Stripe from "stripe";

// FIXED — RELATIVE IMPORT (NO "@")
import { corsHeaders, handleCors } from "../../utils/cors";

// Firebase Admin for secure server-side Firestore
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// -------------------------------------------
// Initialize Firebase Admin (only once)
// -------------------------------------------
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY)),
  });
}

const adminDB = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { uid } = await request.json();

    if (!uid) {
      return new Response(
        JSON.stringify({ error: "Missing UID." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Load user record
    const userRef = adminDB.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return new Response(
        JSON.stringify({ error: "User not found." }),
        { status: 404, headers: corsHeaders() }
      );
    }

    const data = snap.data();

    if (!data.stripeCustomerId) {
      return new Response(
        JSON.stringify({
          error: "No Stripe customer found for this account.",
        }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: data.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
