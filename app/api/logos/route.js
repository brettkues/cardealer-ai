import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

export async function GET() {
  const snapshot = await getDocs(collection(db, "logos"));
  const logos = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  return NextResponse.json({ logos });
}

export async function POST(req) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  await addDoc(collection(db, "logos"), {
    url,
    createdAt: Date.now(),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  await deleteDoc(doc(db, "logos", id));

  return NextResponse.json({ success: true });
}
