import { NextResponse } from "next/server";
import { db, storage } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "training"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ files: list });
  } catch (err) {
    return NextResponse.json({ files: [] });
  }
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const bytes = await file.arrayBuffer();

    const fileRef = ref(storage, `training/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, Buffer.from(bytes));
    const url = await getDownloadURL(fileRef);

    const docRef = await addDoc(collection(db, "training"), {
      name: file.name,
      url,
    });

    return NextResponse.json({
      id: docRef.id,
      name: file.name,
      url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    const snap = await getDocs(collection(db, "training"));
    const target = snap.docs.find((d) => d.id === id);

    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const url = target.data().url;
    const path = url.split("/o/")[1].split("?")[0];
    const decoded = decodeURIComponent(path);

    await deleteObject(ref(storage, decoded));
    await deleteDoc(doc(db, "training", id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
