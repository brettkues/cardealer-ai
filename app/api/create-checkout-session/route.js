export const runtime = "nodejs";
export const dynamic = "force-dynamic";  // Prevent static optimization
export const maxDuration = 60;           // Prevent Vercel timeout on cold-start

import { corsHeaders, handleCors } from "../../utils/cors";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const { priceId, uid, email } = await req.json();

    if (!priceId || !uid || !email) {
      return new Response(
        JSON.stringify({ error: "Missing priceId, uid, or email." }),
        { status: 400, headers: corsHeaders() }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        { price: priceId, quantity: 1 }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?canceled=true`,
      metadata: { uid },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
