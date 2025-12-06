import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await adminDB.collection("fi_training_vectors").get();

    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      text: doc.data().text || null,
      fileUrl: doc.data().fileUrl || null,
      createdAt: doc.data().createdAt || null,
    }));

    return NextResponse.json({ entries }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ entries: [] }, { status: 200 });
  }
}
