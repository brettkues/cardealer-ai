// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth,
  GoogleAuthProvider 
} from "firebase/auth";

// IMPORTANT:
// Firebase 10 requires explicit separation of server/web imports.
// This version is SAFE for Next.js 13/14 App Router.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;

// Prevent reinitialization during hot reloads
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// CLIENT-ONLY AUTH
export const auth = typeof window !== "undefined" ? getAuth(app) : null;

// Provider is safe client-side
export const googleProvider = new GoogleAuthProvider();

export default app;
