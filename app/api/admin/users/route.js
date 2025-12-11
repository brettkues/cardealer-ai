import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export async function GET() {
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
  return NextResponse.json({ users });
}

export async function POST(req) {
  const { uid, role } = await req.json();
  await updateDoc(doc(db, "users", uid), { role });
  return NextResponse.json({ success: true });
}

export async function DELETE(req) {
  const { uid } = await req.json();
  await deleteDoc(doc(db, "users", uid));
  return NextResponse.json({ success: true });
}
