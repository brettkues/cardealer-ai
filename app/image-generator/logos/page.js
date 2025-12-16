"use client";

import { useEffect, useState } from "react";
import { storage, db } from "@/lib/firebaseClient";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

export default function LogosPage() {
  const [files, setFiles] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSaved();
  }, []);

  async function loadSaved() {
    const snap = await getDocs(collection(db, "logos"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setSaved(list);
  }

  async function handleUpload() {
    if (!files.length) return;

    setLoading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Only allow JPG / PNG
        if (!["image/png", "image/jpeg"].includes(file.type)) continue;

        const id = `logo_${Date.now()}_${i}`;
        const fileRef = ref(storage, `logos/${id}`);

        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        await setDoc(doc(db, "logos", id), { url });
      }

      setFiles([]);
      await loadSaved();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(logo) {
    if (!confirm("Delete this logo?")) return;

    // Delete from Storage
    await deleteObject(ref(storage, `logos/${logo.id}`));

    // Delete Firestore record
    await deleteDoc(doc(db, "logos", logo.id));

    await loadSaved();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Logos</h1>

      {/* Upload */}
      <div className="mb-6 space-y-3">
        <input
          type="file"
          accept="image/png,image/jpeg"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          {loading ? "Uploading…" : "Upload Logos"}
        </button>

        <p className="text-sm text-gray-600">
          PNG or JPG only. Logos are used in generated images.
        </p>
      </div>

      {/* Saved Logos */}
      <h2 className="text-xl font-semibold mb-3">
        Saved Logos ({saved.length})
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {saved.map((l) => (
          <div
            key={l.id}
            className="relative border rounded p-3 bg-white"
          >
            <button
              onClick={() => handleDelete(l)}
              className="absolute top-1 right-1 text-red-600 font-bold text-lg"
              title="Delete logo"
            >
              ×
            </button>

            <img
              src={l.url}
              alt="Logo"
              className="w-full h-24 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
