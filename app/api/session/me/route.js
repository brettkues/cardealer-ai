export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

// Firebase config (client-side keys are safe on server)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase once
if (!getApps().length) initializeApp(firebaseConfig);

export async function GET() {
  try {
    const auth = getAuth();

    // Firebase Auth must be read using a promise wrapper
    const uid = await new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        resolve(user?.uid || null);
      });
    });

    return NextResponse.json({ uid });
  } catch (err) {
    return NextResponse.json({ uid: null });
  }
}
