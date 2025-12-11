import { NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// GET — list all users
export async function GET() {
  const snap = await getDocs(collection(db, "users"));
  const users = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  return NextResponse.json({ users });
}

// POST — update user role
export async function POST(req) {
  const { uid, role } = await req.json();

  if (!uid || !role) {
    return NextResponse.json(
      { error: "Missing uid or role" },
      { status: 400 }
    );
  }

  await updateDoc(doc(db, "users", uid), { role });
  return NextResponse.json({ success: true });
}

// DELETE — remove a user
export async function DELETE(req) {
  const { uid } = await req.json();

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  await deleteDoc(doc(db, "users", uid));

  return NextResponse.json({ success: true });
}
