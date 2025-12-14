import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 🔒 Firebase config — assumes you already have env vars set
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const storage = getStorage();

export async function POST(req) {
  try {
    const { image } = await req.json();

    if (!image || !image.startsWith("data:image")) {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Decode base64
    const base64 = image.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    const id = Date.now().toString();
    const fileRef = ref(storage, `generated/${id}.png`);

    await uploadBytes(fileRef, buffer, {
      contentType: "image/png"
    });

    const url = await getDownloadURL(fileRef);

    return NextResponse.json({ url });
  } catch (err) {
    console.error("SAVE IMAGE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}
