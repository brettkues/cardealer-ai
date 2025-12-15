import { NextResponse } from "next/server";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ---------- init admin ---------- */
if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const db = getFirestore();
const auth = getAuth();

/* ---------- GET: anyone can read ---------- */
export async function GET() {
  try {
    const snap = await db.collection("logos").get();

    const logos = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ logos });
  } catch (err) {
    console.error("LOGO FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load logos" },
      { status: 500 }
    );
  }
}

/* ---------- POST: admin / manager only ---------- */
export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await auth.verifyIdToken(token);

    const userSnap = await db.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const role = userSnap.data().role;
    if (role !== "admin" && role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, imageUrl } = await req.json();

    if (!name || !imageUrl) {
      return NextResponse.json(
        { error: "Missing name or imageUrl" },
        { status: 400 }
      );
    }

    await db.collection("logos").add({
      name,
      imageUrl,
      createdAt: new Date(),
      createdBy: decoded.uid,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("LOGO SAVE ERROR:", err);
    return NextResponse.json(
      { error: "Logo save failed" },
      { status: 500 }
    );
  }
}
