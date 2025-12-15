import { NextResponse } from "next/server";
import { auth } from "@/lib/firebaseAdmin";
import { db } from "@/lib/firebaseAdmin";
import { getDoc, doc, addDoc, collection } from "firebase/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/*
  Expected body:
  {
    imageUrl: string,   // signed GCS URL already uploaded
    name: string        // friendly name (e.g. "Pischke Nissan")
  }
*/

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await auth.verifyIdToken(token);

    const userSnap = await getDoc(doc(db, "users", decoded.uid));
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    const role = userSnap.data().role;
    if (role !== "admin" && role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { imageUrl, name } = await req.json();

    if (!imageUrl || !name) {
      return NextResponse.json(
        { error: "Missing imageUrl or name" },
        { status: 400 }
      );
    }

    await addDoc(collection(db, "logos"), {
      name,
      imageUrl,
      createdAt: new Date(),
      createdBy: decoded.uid,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("LOGO UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Logo upload failed" },
      { status: 500 }
    );
  }
}
