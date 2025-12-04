export const runtime = "nodejs";
export const preferredRegion = "iad1";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// UPDATED — Firebase must import from /lib
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "No promo code provided" },
        { status: 400 }
      );
    }

    const promoRef = doc(db, "promocodes", code);
    const promoSnap = await getDoc(promoRef);

    if (!promoSnap.exists()) {
      return NextResponse.json(
        { valid: false, message: "Invalid promo code" },
        { status: 404 }
      );
    }

    const promoData = promoSnap.data();

    return NextResponse.json({
      valid: true,
      discount: promoData.discount || 0,
      message: "Promo applied",
    });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: err.message },
      { status: 500 }
    );
  }
}
