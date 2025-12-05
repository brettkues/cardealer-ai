import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  deleteObject
} from "firebase/storage";

// Firebase config (client-safe)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Initialize once
if (!getApps().length) initializeApp(firebaseConfig);

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

    // Remove file from storage
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (err) {
      // Ignore storage delete errors (file may already be gone)
    }

    // Remove DB record
    await deleteDoc(doc(db, "lawLibrary", id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
