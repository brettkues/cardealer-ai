"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSubscription } from "@/app/utils/checkSubscription";
import { auth, db, storage } from "@/app/firebase";
import { signOut } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";

// Tooltip component
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
        <div className="absolute z-20 left-0 mt-2 w-64 bg-gray-800 text-gray-200
                        text-sm p-3 rounded-xl border border-gray-700 shadow-xl">
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

  // LOGIN + SUBSCRIPTION ENFORCEMENT
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const active = await checkSubscription(user.uid);

      if (!active) {
        router.push("/subscribe");
        return;
      }

      setSub({
        loggedIn: true,
        active,
        uid: user.uid,
      });
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

  const uid = sub.uid;

  // LOAD UPLOADED DOCS
  const loadDocs = async () => {
    const q =
      sub.role === "admin"
        ? query(collection(db, "lawLibrary"))
        : query(collection(db, "lawLibrary"), where("owner", "==", uid));

    const snap = await getDocs(q);
    setUploaded(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    loadDocs();
  }, [sub]);

  // UPLOAD PDF
  const uploadPDF = async () => {
    if (!file) {
      alert("Select a PDF first.");
      return;
    }

    setLoading(true);

    try {
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
      alert("PDF uploaded.");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    setLoading(false);
  };

  // SAVE TEXT LAW
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

  // DELETE PDF
  const deletePDF = async (item) => {
    if (!confirm("Delete this file?")) return;

    try {
      await deleteObject(ref(storage, item.storagePath));
    } catch {}

    await deleteDoc(doc(db, "lawLibrary", item.id));
    await loadDocs();
  };

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

      {/* BODY */}
      <div className="p-8 max-w-4xl mx-auto w-full">
        {/* DISCLAIMER */}
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-4 rounded-xl mb-8">
          <strong>Important:</strong> If you do not upload state advertising
          laws, the platform defaults to <strong>Wisconsin</strong>.
        </div>

        {/* STATE SELECT */}
        <label className="text-gray-300 font-semibold">
          Select State
          <Tooltip text="Pick WI unless you're uploading laws for another state." />
        </label>

        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 mt-2 mb-6"
        >
          <option value="WI">Wisconsin (WI)</option>
          <option value="OTHER">Other State</option>
        </select>

        {/* PDF UPLOAD */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-xl font-semibold mb-3">Upload PDF</h2>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-gray-300 mb-4"
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
          <h2 className="text-xl font-semibold mb-2">Paste Law Text</h2>

          <textarea
            value={textLaw}
            onChange={(e) => setTextLaw(e.target.value)}
            className="w-full h-48 bg-gray-700 text-white p-3 rounded-lg border border-gray-600"
          ></textarea>

          <button
            onClick={saveTextLaw}
            disabled={loading}
            className="w-full py-3 mt-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
          >
            {loading ? "Saving…" : "Save Text"}
          </button>
        </div>

        {/* LIST */}
        <h2 className="text-xl font-semibold mb-4">Your Uploaded PDFs</h2>

        {uploaded.length === 0 && (
          <p className="text-gray-400">No PDFs uploaded.</p>
        )}

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

        <p className="text-gray-400 text-sm mt-8">
          If outside Wisconsin, upload your own laws.
        </p>
      </div>
    </div>
  );
}
