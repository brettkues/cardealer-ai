"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { watchSubscription } from "@/app/utils/checkSubscription";
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
} from "firebase/firestore";

export default function LawsPage() {
  const router = useRouter();
  const [sub, setSub] = useState(null);

  const [file, setFile] = useState(null);
  const [state, setState] = useState("WI");
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(false);

  // ----------------------------------------
  // ENFORCE LOGIN + SUBSCRIPTION
  // ----------------------------------------
  useEffect(() => {
    const unsub = watchSubscription((status) => {
      if (!status.loggedIn) {
        router.push("/login");
        return;
      }

      if (!status.active) {
        router.push("/subscribe");
        return;
      }

      setSub(status);
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

  // ----------------------------------------
  // LOAD DEALER-SPECIFIC PDFs
  // Admin sees all PDFs
  // ----------------------------------------
  const loadPDFs = async () => {
    if (!auth.currentUser) return;

    const q =
      sub.role === "admin"
        ? query(collection(db, "lawLibrary"))
        : query(
            collection(db, "lawLibrary"),
            where("owner", "==", auth.currentUser.uid)
          );

    const snap = await getDocs(q);

    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setUploaded(list);
  };

  useEffect(() => {
    loadPDFs();
  }, [sub]);

  // ----------------------------------------
  // UPLOAD PDF
  // ----------------------------------------
  const uploadPDF = async () => {
    if (!file) {
      alert("Please choose a PDF.");
      return;
    }

    setLoading(true);

    try {
      const uid = auth.currentUser.uid;

      const storagePath = `laws/${uid}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file);

      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "lawLibrary"), {
        owner: uid,
        state,
        url,
        filename: file.name,
        storagePath,
        uploadedAt: new Date(),
      });

      setFile(null);
      await loadPDFs();
      alert("PDF uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload error: " + err.message);
    }

    setLoading(false);
  };

  // ----------------------------------------
  // DELETE PDF
  // ----------------------------------------
  const deletePDF = async (item) => {
    if (!confirm("Delete this PDF?")) return;

    try {
      await deleteObject(ref(storage, item.storagePath));
      await deleteDoc(doc(db, "lawLibrary", item.id));
      await loadPDFs();
    } catch (error) {
      console.error(error);
      alert("Error deleting file.");
    }
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
        {/* LEGAL DISCLAIMER */}
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-4 rounded-xl mb-8">
          <strong>Important:</strong>  
          If you do <u>not</u> upload your state’s advertising laws, the system
          will automatically use <strong>Wisconsin advertising law</strong> as the
          default compliance standard.  
          Wisconsin law is one of the strictest in the U.S., and your state may
          require different disclosures.
        </div>

        <p className="text-gray-300 mb-6">
          Upload state advertising laws. These documents will be used to generate
          automatic disclosures for your social images and train the AI for
          compliance questions.
        </p>

        {/* UPLOAD SECTION */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-10">
          <h2 className="text-2xl font-semibold mb-4">Upload PDF</h2>

          {/* State Selector */}
          <label className="block mb-2 text-gray-300 font-semibold">
            Select State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full mb-6 p-3 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="WI">Wisconsin (WI)</option>
            <option value="OTHER">Other State</option>
          </select>

          {/* File input */}
          <input
            type="file"
            accept="application/pdf"
            className="text-gray-300 mb-4"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            onClick={uploadPDF}
            disabled={loading || !file}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
          >
            {loading ? "Uploading…" : "Upload PDF"}
          </button>
        </div>

        {/* PDF LIST */}
        <h2 className="text-2xl font-semibold mb-4">Your Uploaded Laws</h2>

        {uploaded.length === 0 && (
          <p className="text-gray-400">No PDFs uploaded yet.</p>
        )}

        <div className="space-y-4">
          {uploaded.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-800 border border-gray-700 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{item.filename}</p>
                <p className="text-gray-400 text-sm">
                  State: {item.state === "WI" ? "Wisconsin" : "Other"}
                </p>
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

        <div className="text-gray-400 text-sm mt-8">
          <p>
            If you operate in a state other than Wisconsin, upload your
            advertising laws to ensure accurate disclosures.
          </p>
        </div>
      </div>
    </div>
  );
}
