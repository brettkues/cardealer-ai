import { corsHeaders, handleCors } from "@/app/utils/cors";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  // Handle preflight
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const { uid, plan } = await request.json();

    if (!uid) {
      return new Response(JSON.stringify({ error: "Missing UID." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    if (!plan || (plan !== "monthly" && plan !== "annual")) {
      return new Response(JSON.stringify({ error: "Invalid plan." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Stripe price IDs (replace with your live/test IDs when ready)
    const PRICE_IDS = {
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      annual: process.env.STRIPE_PRICE_ANNUAL,
    };

    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Missing Stripe price ID." }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    // ------------------------------
    // CREATE STRIPE CHECKOUT SESSION
    // ------------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      // Important: link subscription to the dealer UID
      metadata: {
        uid,
        plan,
      },

      subscription_data: {
        metadata: {
          uid,
          plan,
        },
      },

      // Where Stripe returns dealer after payment success
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ai?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?checkout=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
