import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

// Firebase (client-compatible config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Init Firebase safely on server
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();
const storage = getStorage();

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");
    const state = formData.get("state");
    const uid = formData.get("uid");

    if (!file || !state || !uid) {
      return NextResponse.json(
        { error: "Missing file, state, or uid" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `laws/${uid}/${fileName}`;
    const fileRef = ref(storage, storagePath);

    // Upload to Firebase Storage
    await uploadBytes(fileRef, buffer);

    // Get public URL
    const url = await getDownloadURL(fileRef);

    // Store DB record
    await addDoc(collection(db, "lawLibrary"), {
      type: "pdf",
      state,
      url,
      filename: file.name,
      owner: uid,
      storagePath,
      uploadedAt: new Date(),
    });

    return NextResponse.json({ success: true, url });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
