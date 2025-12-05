import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Firebase config (safe for server)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// Initialize Firebase only once
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

// Lazy-loaded Firebase Storage (prevents undici build errors)
async function loadStorage() {
  const mod = await import("firebase/storage");
  return {
    getStorage: mod.getStorage,
    ref: mod.ref,
    uploadBytes: mod.uploadBytes,
    getDownloadURL: mod.getDownloadURL,
  };
}

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

    // Convert uploaded file → buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Lazy-load storage
    const { getStorage, ref, uploadBytes, getDownloadURL } =
      await loadStorage();

    const storage = getStorage();

    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `laws/${uid}/${fileName}`;
    const fileRef = ref(storage, storagePath);

    // Upload PDF
    await uploadBytes(fileRef, buffer);

    // Get URL
    const url = await getDownloadURL(fileRef);

    // Write to DB
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
