"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Firebase client-side
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
  doc,
  setDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

if (!getApps().length) initializeApp(firebaseConfig);

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

  // SUBSCRIPTION CHECK (via API instead of server import)
  async function checkSub(uid) {
    const res = await fetch("/api/subscription", {
      method: "POST",
      body: JSON.stringify({ uid })
    });
    const data = await res.json();
    return data.active === true;
  }

  // LOGIN + SUB CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const active = await checkSub(user.uid);
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

  // LOAD USER FILES
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

  // UPLOAD PDF (via API, not firebase/storage)
  const uploadPDF = async () => {
    if (!file) return alert("Please select a PDF.");
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("state", state);
      form.append("uid", uid);

      const res = await fetch("/api/laws/upload", {
        method: "POST",
        body: form
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setFile(null);
      await loadDocs();
      alert("PDF uploaded successfully!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    setLoading(false);
  };

  // SAVE LAW TEXT
  const saveTextLaw = async () => {
    if (!textLaw.trim()) return alert("Text is empty.");

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
  };

  // DELETE PDF
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

  // UI
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* HEADER */}
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
        {/* WARNING BANNER */}
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-4 rounded-xl mb-8">
          <strong>Important:</strong> If you do not upload state-specific laws, default is  
          <strong> Wisconsin law</strong>.
        </div>

        {/* STATE SELECT */}
        <label className="text-gray-300 font-semibold">
          Select State <Tooltip text="Choose which state's advertising laws you want to upload." />
        </label>

        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 mt-2 mb-6"
        >
          <option value="WI">Wisconsin (WI)</option>
          <option value="OTHER">Other State</option>
        </select>

        {/* UPLOAD PDF */}
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

        {/* TEXT INPUT */}
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

        {/* FILE LIST */}
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
