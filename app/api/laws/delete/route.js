import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";

// Init Firebase client-safe (Admin not needed here)
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

// Lazy import storage — avoids Undici/Webpack parse errors
async function getStorageOps() {
  const mod = await import("firebase/storage");
  return {
    getStorage: mod.getStorage,
    ref: mod.ref,
    deleteObject: mod.deleteObject
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

    // Delete from storage – errors ignored if file missing
    try {
      const { getStorage, ref, deleteObject } = await getStorageOps();
      const storage = getStorage();
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch {
      // ignore storage errors
    }

    // Delete Firestore document
    await deleteDoc(doc(db, "lawLibrary", id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
