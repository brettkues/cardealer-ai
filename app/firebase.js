// app/utils/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2B08TUUYJwLTGiT1dTlowc64-aJAXjjE",
  authDomain: "cardealer-ai.firebaseapp.com",
  projectId: "cardealer-ai",
  storageBucket: "cardealer-ai.firebasestorage.app",
  messagingSenderId: "886575208060",
  appId: "1:886575208060:web:23e5ff2001e9a518e09bf9",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore
export const db = getFirestore(app);

// Firebase Storage (required)
export const storage = getStorage(app);
