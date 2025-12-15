"use client";

import { useEffect, useState } from "react";
import { storage, db, auth } from "@/lib/firebaseClient";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
} from "firebase/storage";
import {
  collection,
  setDoc,
  doc,
  getDocs,
} from "firebase/firestore";

export default function LogosPage() {
  const [files, setFiles] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSaved();
  }, []);

  async function loadSaved() {
    try {
      const folderRef = ref(storage, "logos/");
      const all = await listAll(folderRef);

      const urls = await Promise.all(
        all.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { id: item.name, url };
        })
      );

      setSaved(urls);
    } catch (err) {
      console.error("LOAD LOGOS ERROR:", err);
      setError("Failed to load saved logos.");
    }
  }

  async function handleUpload() {
    setError("");

    if (!files.length) {
      setError("Please select at least one file.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to upload logos.");
      return;
    }

    setLoading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Only allow PNG/JPG
        if (!["image/png", "image/jpeg"].includes(file.type)) {
          throw new Error("Only PNG or JPG images are allowed.");
        }

        const fileId = `logo_${Date.now()}_${i}`;
        const fileRef = ref(storage, `logos/${fileId}`);

        // 1️⃣ Upload to Firebase Storage
        await uploadBytes(fileRef, file);

        // 2️⃣ Get public URL
        const url = await getDownloadURL(fileRef);

        // 3️⃣ Save metadata to Firestore
        await setDoc(doc(db, "logos", fileId), {
          url,
          uploadedAt: new Date(),
          uploadedBy: user.uid,
        });
      }

      setFiles([]);
      await loadSaved();
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      setError(err.message || "Logo upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Logo Vault</h1>

      {error && (
        <div className="mb-4 text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-4 mb-8 border p-4 rounded">
        <h2 className="text-xl font-semibold">Upload Logos</h2>

        <input
          type="file"
          accept="image/png,image/jpeg"
          multiple
          onChange={(e) =>
            setFiles(Array.from(e.target.files || []))
          }
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload Logos"}
        </button>
      </div>

      {/* Saved Logos */}
      <h2 className="text-xl font-semibold mb-3">Saved Logos</h2>

      <div className="grid grid-cols-3 gap-4">
        {saved.map((l) => (
          <div key={l.id} className="border rounded p-2">
            <img
              src={l.url}
              className="w-full h-24 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
