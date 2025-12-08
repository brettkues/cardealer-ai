// FULL firebase.js — SAFE FOR NEXT.JS APP ROUTER

"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase config using public environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_CLEAN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ALWAYS create auth on the client — no server checking
export const auth = getAuth(app);

// Google Login provider
export const googleProvider = new GoogleAuthProvider();

// Expose auth globally (so console tests work)
if (typeof window !== "undefined") {
  window.firebaseAuth = auth;
}

export default app;
