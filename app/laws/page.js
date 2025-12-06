"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc
} from "firebase/firestore";

// ----------------------------
// FIREBASE CLIENT INIT
// ----------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) initializeApp(firebaseConfig);

const auth = getAuth();
const db = getFirestore();

// ----------------------------
// HELPER: CHECK SESSION + SUB
// ----------------------------
async function getSession() {
  try {
    const res = await fetch("/api/auth/session/get", { method: "GET" });
    return await res.json();
  } catch {
    return { uid: null };
  }
}

async function getSubscription(uid) {
  try {
    const res = await fetch("/api/subscription", {
      method: "POST",
      body: JSON.stringify({ uid }),
    });
    return await res.json();
  } catch {
    return { active: false };
  }
}

// ----------------------------
// UI COMPONENTS
// ----------------------------
function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(!open)}
    >
      <span className="ml-2 text-blue-400 cursor-pointer">ⓘ</span>
      {open && (
        <div className="absolute left-0 mt-2 w-64 bg-gray-800 text-gray-200 text-sm p-3 rounded-lg border border-gray-700 shadow-xl">
          {text}
        </div>
      )}
    </span>
  );
}

// ----------------------------
// MAIN PAGE
// ----------------------------
export default function LawsPage() {
  const router = useRouter();

  const [uid, setUid] = useState(null);
  const [state, setState] = useState("WI");
  const [file, setFile] = useState(null);
  const [textLaw, setTextLaw] = useState("");
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // AUTH + SUB CHECK
  // ----------------------------
  useEffect(() => {
    async function init() {
      const session = await getSession();

      if (!session.uid) {
        router.push("/login");
        return;
      }

      const sub = await getSubscription(session.uid);

      if (!sub.active) {
        router.push("/subscribe");
        return;
      }

      setUid(session.uid);
    }

    init();
  }, [router]);

  // ----------------------------
  // LOAD USER FILES
  // ----------------------------
  async function loadDocs() {
    if (!uid) return;

    const q = query(collection(db, "lawLibrary"), where("owner", "==", uid));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUploaded(list);
  }

  useEffect(() => {
    loadDocs();
  }, [uid]);

  // ----------------------------
  // UPLOAD PDF → API ROUTE
  // ----------------------------
  async function uploadPDF() {
    if (!file) return alert("Please select a PDF.");

    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("uid", uid);
      form.append("state", state);

      const res = await fetch("/api/laws/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("PDF uploaded successfully!");
      setFile(null);
      loadDocs();
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    setLoading(false);
  }

  // ----------------------------
  // SAVE TEXT LAW
  // ----------------------------
  async function saveTextLaw() {
    if (!textLaw.trim()) return alert("Text is empty.");

    await setDoc(doc(db, "lawText", `${uid}_${state}`), {
      type: "text",
      state,
      text: textLaw.trim(),
      owner: uid,
      updatedAt: new Date(),
    });

    setTextLaw("");
    alert("Saved!");
  }

  // ----------------------------
  // DELETE PDF
  // ----------------------------
  async function deletePDF(item) {
    if (!confirm("Delete this file?")) return;

    await fetch("/api/laws/delete", {
      method: "POST",
      body: JSON.stringify({
        id: item.id,
        storagePath: item.storagePath,
      }),
    });

    loadDocs();
  }

  // ----------------------------
  // RENDER UI
  // ----------------------------
  if (!uid) {
    return (
      <div className="h-screen flex justify-center items-center text-white">
        Checking access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      <div className="p-5 bg-gray-800 border-b border-gray-700 flex justify-between">
        <h1 className="text-xl font-bold">Advertising Law Library</h1>
        <button
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 rounded-lg"
        >
          Sign Out
        </button>
      </div>

      <div className="p-8 max-w-4xl mx-auto">

        <label className="text-gray-300 font-semibold">
          Select State <Tooltip text="Choose which state's advertising laws you want to upload." />
        </label>

        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full bg-gray-700 p-3 rounded-lg mt-2 mb-6"
        >
          <option value="WI">Wisconsin (WI)</option>
          <option value="OTHER">Other State</option>
        </select>

        {/* PDF Upload */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-lg font-semibold mb-3">Upload PDF</h2>

          <input
            type="file"
            accept="application/pdf"
            className="text-gray-300 mb-4"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            disabled={!file || loading}
            onClick={uploadPDF}
            className="w-full py-3 bg-blue-600 rounded-lg"
          >
            {loading ? "Uploading…" : "Upload PDF"}
          </button>
        </div>

        {/* TEXT LAW */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-lg font-semibold mb-2">Paste Law Text</h2>

          <textarea
            value={textLaw}
            onChange={(e) => setTextLaw(e.target.value)}
            className="w-full h-48 bg-gray-700 p-3 border border-gray-600 rounded-lg"
          />

          <button
            onClick={saveTextLaw}
            className="w-full py-3 mt-3 bg-green-600 rounded-lg"
          >
            Save Text
          </button>
        </div>

        {/* FILE LIST */}
        <h2 className="text-lg font-semibold mb-4">Your PDFs</h2>

        {uploaded.length === 0 ? (
          <p className="text-gray-400">No PDFs uploaded.</p>
        ) : (
          uploaded.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-800 border border-gray-700 rounded-xl flex justify-between mb-4"
            >
              <div>
                <p className="font-semibold">{item.filename}</p>
                <p className="text-gray-400 text-sm">State: {item.state}</p>
              </div>

              <div className="flex gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  className="px-3 py-2 bg-green-600 rounded-lg text-sm"
                >
                  View
                </a>

                <button
                  onClick={() => deletePDF(item)}
                  className="px-3 py-2 bg-red-600 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
