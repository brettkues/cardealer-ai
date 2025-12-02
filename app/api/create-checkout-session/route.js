export const runtime = "nodejs";         // Stripe requires Node.js runtime
export const dynamic = "force-dynamic";  // Prevent static optimization
export const maxDuration = 60;           // Prevent Vercel timeout on cold-start

import { corsHeaders, handleCors } from "@/app/utils/cors";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const preflight = handleCors(request);
  if (preflight) return preflight;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid content type." }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

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
