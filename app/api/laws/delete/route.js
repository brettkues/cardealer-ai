import { NextResponse } from "next/server";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getStorage, ref, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();
const storage = getStorage();

export async function POST(req) {
  try {
    const { id, storagePath } = await req.json();

    if (!id || !storagePath) {
      return NextResponse.json(
        { error: "Missing id or storagePath" },
        { status: 400 }
      );
    }

    // Delete the file from storage
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);

    // Delete DB doc
    await deleteDoc(doc(db, "lawLibrary", id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
