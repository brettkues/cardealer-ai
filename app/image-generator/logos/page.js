"use client";

import { useEffect, useState } from "react";
import { storage, db } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { collection, setDoc, doc, getDocs } from "firebase/firestore";

export default function LogosPage() {
  const [files, setFiles] = useState([]);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    loadSaved();
  }, []);

  async function loadSaved() {
    const folderRef = ref(storage, "logos/");
    const all = await listAll(folderRef);

    const urls = await Promise.all(
      all.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return { id: item.name, url };
      })
    );

    setSaved(urls);
  }

  async function handleUpload() {
    if (!files.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `logo_${Date.now()}_${i}`;

      const fileRef = ref(storage, `logos/${fileId}`);
      await uploadBytes(fileRef, file);

      const url = await getDownloadURL(fileRef);

      await setDoc(doc(db, "logos", fileId), { url });
    }

    setFiles([]);
    await loadSaved();
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Logos</h1>

      {/* Upload Section */}
      <div className="space-y-4">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />

        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          Upload Logos
        </button>

        {/* Saved Logos */}
        <h2 className="text-xl font-semibold mt-6">Saved Logos</h2>

        <div className="grid grid-cols-3 gap-4 mt-3">
          {saved.map((l) => (
            <div key={l.id} className="border rounded p-2">
              <img src={l.url} className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

