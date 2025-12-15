"use client";

import { useEffect, useState } from "react";
import { storage, db, auth } from "@/lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { collection, setDoc, doc, getDocs, getDoc } from "firebase/firestore";

export default function LogosPage() {
  const [files, setFiles] = useState([]);
  const [saved, setSaved] = useState([]);
  const [role, setRole] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadUserRole();
    loadSaved();
  }, []);

  async function loadUserRole() {
    const user = auth.currentUser;
    if (!user) return;

    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      setRole(snap.data().role);
    }
  }

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

      await setDoc(doc(db, "logos", fileId), {
        url,
        uploadedAt: new Date(),
        uploadedBy: auth.currentUser.uid,
      });
    }

    setFiles([]);
    await loadSaved();
  }

  const canUpload = role === "admin" || role === "manager";

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Logo Vault</h1>

      {/* Upload Section (role-gated) */}
      {canUpload && (
        <div className="space-y-4 mb-8 border p-4 rounded">
          <h2 className="text-xl font-semibold">Upload Logos</h2>

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
        </div>
      )}

      {/* Saved Logos */}
      <h2 className="text-xl font-semibold mb-3">Saved Logos</h2>

      <div className="grid grid-cols-3 gap-4">
        {saved.map((l) => (
          <div
            key={l.id}
            onClick={() => setSelected(l)}
            className={`border rounded p-2 cursor-pointer ${
              selected?.id === l.id ? "ring-2 ring-blue-600" : ""
            }`}
          >
            <img src={l.url} className="w-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}
