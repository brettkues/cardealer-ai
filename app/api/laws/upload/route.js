export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
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
    const formData = await req.formData();

    const file = formData.get("file");
    const uid = formData.get("uid");
    const state = formData.get("state");

    if (!file || !uid || !state) {
      return NextResponse.json(
        { error: "Missing file, uid, or state." },
        { status: 400 }
      );
    }

    // Enforce PDF Limit — 20MB
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 20MB limit." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}_${file.name}`;
    const storagePath = `laws/${uid}/${filename}`;
    const fileRef = ref(storage, storagePath);

    await uploadBytes(fileRef, buffer);
    const url = await getDownloadURL(fileRef);

    const docRef = await addDoc(collection(db, "lawLibrary"), {
      type: "pdf",
      state,
      url,
      filename: file.name,
      owner: uid,
      storagePath,
      uploadedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      url,
      id: docRef.id
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
