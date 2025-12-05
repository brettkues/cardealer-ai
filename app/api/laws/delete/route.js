import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

// Firebase (client-safe config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Initialize Firebase ONCE
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// ------------------------------
// LAZY STORAGE IMPORT — FIXES ERROR
// ------------------------------
async function loadStorage() {
  const mod = await import("firebase/storage");
  return {
    getStorage: mod.getStorage,
    ref: mod.ref,
    deleteObject: mod.deleteObject,
  };
}

export async function POST(req) {
  try {
    const { id, storagePath } = await req.json();

    if (!id || !storagePath) {
      return NextResponse.json(
        { error: "Missing id or storagePath" },
        { status: 400 }
      );
    }

    // DELETE STORAGE FILE (safe—errors ignored)
    try {
      const { getStorage, ref, deleteObject } = await loadStorage();
      const storage = getStorage();
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch {
      // Ignore errors (file already gone)
    }

    // DELETE FIRESTORE RECORD
    await deleteDoc(doc(db, "lawLibrary", id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
