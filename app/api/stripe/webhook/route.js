export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextResponse } from "next/server";

// UPDATED — must import firebase from /lib
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }

  try {
    // Handle subscription creation/updates
    if (event.type === "checkout.session.completed") {
      const session = event
