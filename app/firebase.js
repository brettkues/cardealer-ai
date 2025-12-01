// /app/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2B08TUUYJwLTGiT1dTlowc64-aJAXjjE",
  authDomain: "cardealer-ai.firebaseapp.com",
  projectId: "cardealer-ai",
  storageBucket: "cardealer-ai.appspot.com",
  messagingSenderId: "886575208060",
  appId: "1:886575208060:web:23e5ff2001e9a518e09bf9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
