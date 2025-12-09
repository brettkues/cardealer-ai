import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCMV_OcrUCvULifrb9CGlrUOVpC6i_gDwY",
  authDomain: "cardealership-ai-main-e41ec.firebaseapp.com",
  projectId: "cardealership-ai-main-e41ec",
  storageBucket: "cardealership-ai-main-e41ec.firebasestorage.app",
  messagingSenderId: "747094611434",
  appId: "1:747094611434:web:fd53eea6dae5b8305e4e93",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Authentication
export const auth = getAuth(app);

// Persistence (keeps user logged in)
setPersistence(auth, browserLocalPersistence).catch((err) =>
  console.error("Firebase persistence error:", err)
);

// Google provider (this uses the Firebase-managed Web Client ID automatically)
export const googleProvider = new GoogleAuthProvider();

export default app;
