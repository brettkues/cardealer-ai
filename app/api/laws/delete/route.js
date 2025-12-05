export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  deleteDoc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  deleteObject
} from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();
const storage = getStorage();

export async function POST(req) {
  try {
    const { docId, storagePath } = await req.json();

    if (!docId || !storagePath) {
      return NextResponse.json(
        { error: "Missing docId or storagePath" },
        { status: 400 }
      );
    }

    // Delete the file from Firebase Storage
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn("Failed to delete file from storage:", err);
    }

    // Delete Firestore document
    await deleteDoc(doc(db, "lawLibrary", docId));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
