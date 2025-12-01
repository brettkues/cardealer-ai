import Stripe from "stripe";
import { corsHeaders, handleCors } from "@/app/utils/cors";
import { db } from "@/app/firebase";
import { doc, getDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  // CORS preflight
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

    // ------------------------------------
    // Load dealer record from Firestore
    // ------------------------------------
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
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
            "No Stripe customer found for this account. Make sure you have an active subscription.",
        }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // ------------------------------------
    // CREATE BILLING PORTAL SESSION
    // ------------------------------------
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: data.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return new Response(
      JSON.stringify({ url: portalSession.url }),
      {
        status: 200,
        headers: corsHeaders(),
      }
    );

  } catch (err) {
    console.error("Billing portal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
