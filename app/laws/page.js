"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// CLIENT-FRIENDLY FIREBASE INIT
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  setDoc
} from "firebase/firestore";

// LAZY-LOADED STORAGE (AVOIDS BUILD ERRORS)
let storageModule = null;
async function loadStorage() {
  if (storageModule) return storageModule;
  storageModule = await import("firebase/storage");
  return storageModule;
}

// SERVER-SAFE CHECK
import { checkSubscription } from "@/lib/checkSubscription";

// Initialize Firebase client app
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const db = getFirestore();

function Tooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onClick={() => setOpen(!open)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span className="ml-2 cursor-pointer text-blue-400 text-sm">ⓘ</span>
      {open && (
        <div className="absolute z-20 left-0 mt-2 w-64 bg-gray-800 text-gray-200 text-sm p-3 rounded-xl border border-gray-700 shadow-xl">
          {text}
        </div>
      )}
    </span>
  );
}

export default function LawsPage() {
  const router = useRouter();

  const [sub, setSub] = useState(null);
  const [file, setFile] = useState(null);
  const [textLaw, setTextLaw] = useState("");
  const [state, setState] = useState("WI");
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const active = await checkSubscription(user.uid);

      if (!active) {
        router.push("/subscribe");
        return;
      }

      setSub({ loggedIn: true, active, uid: user.uid });
    });

    return () => unsub();
  }, [router]);

  if (!sub) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking subscription…
      </div>
    );
  }

  const uid = auth.currentUser.uid;

  const loadDocs = async () => {
    const baseQuery =
      sub.role === "admin"
        ? query(collection(db, "lawLibrary"))
        : query(collection(db, "lawLibrary"), where("owner", "==", uid));

    const snap = await getDocs(baseQuery);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUploaded(list);
  };

  useEffect(() => {
    loadDocs();
  }, [sub]);

  const uploadPDF = async () => {
    if (!file) {
      alert("Please select a PDF first.");
      return;
    }

    setLoading(true);

    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } =
        await loadStorage();

      const storage = getStorage();
      const storagePath = `laws/${uid}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "lawLibrary"), {
        type: "pdf",
        state,
        url,
        filename: file.name,
        owner: uid,
        storagePath,
        uploadedAt: new Date(),
      });

      setFile(null);
      await loadDocs();
      alert("PDF uploaded successfully!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    setLoading(false);
  };

  const saveTextLaw = async () => {
    if (!textLaw.trim()) {
      alert("Text is empty.");
      return;
    }

    setLoading(true);

    try {
      await setDoc(doc(db, "lawText", `${uid}_${state}`), {
        type: "text",
        state,
        text: textLaw.trim(),
        owner: uid,
        updatedAt: new Date(),
      });

      setTextLaw("");
      alert("Law text saved!");
    } catch (err) {
      alert("Error saving text: " + err.message);
    }

    setLoading(false);
  };

  const deletePDF = async (item) => {
    if (!confirm("Delete this file?")) return;

    await fetch("/api/laws/delete", {
      method: "POST",
      body: JSON.stringify({
        id: item.id,
        storagePath: item.storagePath,
      }),
    });

    await loadDocs();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advertising Law Library</h1>

        <button
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
        >
          Sign Out
        </button>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-4 rounded-xl mb-8">
          <strong>Important:</strong>
          If you do not upload state advertising laws, the platform will default to Wisconsin laws.
        </div>

        <label className="text-gray-300 font-semibold">
          Select State <Tooltip text="Choose the state whose advertising laws you want to upload." />
        </label>

        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 mt-2 mb-6"
        >
          <option value="WI">Wisconsin (WI)</option>
          <option value="OTHER">Other State</option>
        </select>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-xl font-semibold mb-3">Upload PDF</h2>

          <input
            type="file"
            accept="application/pdf"
            className="text-gray-300 mb-4"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            onClick={uploadPDF}
            disabled={!file || loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
          >
            {loading ? "Uploading…" : "Upload PDF"}
          </button>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-xl font-semibold mb-2">Paste Advertising Law Text</h2>

          <textarea
            value={textLaw}
            onChange={(e) => setTextLaw(e.target.value)}
            className="w-full h-48 bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
          />

          <button
            onClick={saveTextLaw}
            disabled={loading}
            className="w-full py-3 mt-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
          >
            {loading ? "Saving…" : "Save Text"}
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-4">Your Uploaded PDFs</h2>

        {uploaded.length === 0 ? (
          <p className="text-gray-400">No PDFs uploaded.</p>
        ) : (
          <div className="space-y-4">
            {uploaded.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-gray-800 border border-gray-700 rounded-xl flex justify-between"
              >
                <div>
                  <p className="font-semibold">{item.filename}</p>
                  <p className="text-gray-400 text-sm">State: {item.state}</p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
                  >
                    View
                  </a>

                  <button
                    onClick={() => deletePDF(item)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
