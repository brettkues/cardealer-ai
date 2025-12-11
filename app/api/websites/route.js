import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export async function GET() {
  const snap = await getDocs(collection(db, "websites"));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ websites: list });
}

export async function POST(req) {
  const { label, url } = await req.json();
  const ref = await addDoc(collection(db, "websites"), { label, url });
  return NextResponse.json({ id: ref.id, label, url });
}

export async function DELETE(req) {
  const { id } = await req.json();
  await deleteDoc(doc(db, "websites", id));
  return NextResponse.json({ success: true });
}
