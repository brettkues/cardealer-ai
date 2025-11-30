import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/app/firebase";
import { doc, getDoc } from "firebase/firestore";

// IMPORTANT: put your secret key in Vercel environment variables:
// STRIPE_SECRET_KEY=sk_live_...
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { uid, priceId } = await request.json();

    if (!uid || !priceId) {
      return NextResponse.json(
        { error: "Missing UID or Price ID" },
        { status: 400 }
      );
    }

    // Load dealer email from Firestore
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return NextResponse.json(
        { error: "User not found in Firestore" },
        { status: 404 }
      );
    }

    const userData = snap.data();
    const email = userData.email || null;

    // Build Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      subscription_data: {
        metadata: {
          uid,
        },
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
