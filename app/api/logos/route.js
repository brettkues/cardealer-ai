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
  const snap = await getDocs(collection(db, "logos"));
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ logos: list });
}

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mime = file.type;

  const url = `data:${mime};base64,${base64}`;

  const ref = await addDoc(collection(db, "logos"), {
    name: file.name,
    url,
  });

  return NextResponse.json({
    id: ref.id,
    name: file.name,
    url,
  });
}

export async function DELETE(req) {
  const { id } = await req.json();
  await deleteDoc(doc(db, "logos", id));
  return NextResponse.json({ success: true });
}
