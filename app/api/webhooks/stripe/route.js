import { headers } from "next/headers";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle subscription events here
  // Example:
  // if (event.type === "invoice.payment_succeeded") {
  //   console.log("Payment succeeded");
  // }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
