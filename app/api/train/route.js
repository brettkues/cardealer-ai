import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// GET — list training files
export async function GET() {
  try {
    const snap = await getDocs(collection(db, "training"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ files: list });
  } catch (err) {
    return NextResponse.json({ files: [] });
  }
}

// POST — add a new file metadata record (upload happens client-side)
export async function POST(req) {
  try {
    const { name, url } = await req.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: "Missing name or URL" },
        { status: 400 }
      );
    }

    const docRef = await addDoc(collection(db, "training"), {
      name,
      url,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      id: docRef.id,
      name,
      url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Insert failed" },
      { status: 500 }
    );
  }
}

// DELETE — delete Firestore entry only
export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing ID" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "training", id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
