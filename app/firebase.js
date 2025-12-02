// app/utils/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2B08TUUYJwLTGiT1dTlowc64-aJAXjjE",
  authDomain: "cardealer-ai.firebaseapp.com",
  projectId: "cardealer-ai",
  storageBucket: "cardealer-ai.firebasestorage.app",
  messagingSenderId: "886575208060",
  appId: "1:886575208060:web:23e5ff2001e9a518e09bf9"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
auth.useDeviceLanguage(); // REQUIRED FOR CONSISTENCY ON VERCEL

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
