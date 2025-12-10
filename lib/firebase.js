"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMV_OcrUCvULifrb9CGlrUOVpC6i_gDwY",
  authDomain: "cardealership-ai-main-e41ec.firebaseapp.com",
  projectId: "cardealership-ai-main-e41ec",
  storageBucket: "cardealership-ai-main-e41ec.firebasestorage.app",
  messagingSenderId: "747094611434",
  appId: "1:747094611434:web:fd53eea6dae5b8305e4e93",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

export default app;
