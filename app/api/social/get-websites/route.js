import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await adminDB.collection("websites").get();

    const sites = snapshot.docs.map(doc => ({
      id: doc.id,
      url: doc.data().url,
      createdAt: doc.data().createdAt,
    }));

    return NextResponse.json(
      { websites: sites },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { websites: [] },
      { status: 200 }
    );
  }
}
