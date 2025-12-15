"use client";

import { useEffect, useState } from "react";
import { storage, db, auth } from "@/lib/firebaseClient";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
} from "firebase/storage";
import {
  setDoc,
  doc,
} from "firebase/firestore";

export default function LogosPage() {
  const [files, setFiles] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);

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

  function uploadSingleFile(file, index) {
    return new Promise((resolve, reject) => {
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        reject(new Error("Only PNG or JPG images are allowed."));
        return;
      }

      const fileId = `logo_${Date.now()}_${index}`;
      const fileRef = ref(storage, `logos/${fileId}`);

      const task = uploadBytesResumable(fileRef, file, {
        contentType: file.type,
      });

      task.on(
        "state_changed",
        (snapshot) => {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(pct);
        },
        (err) => {
          reject(err);
        },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);

            await setDoc(doc(db, "logos", fileId), {
              url,
              uploadedAt: new Date(),
              uploadedBy: auth.currentUser.uid,
            });

            resolve();
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  async function handleUpload() {
    setError("");
    setProgress(null);

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
        await uploadSingleFile(files[i], i);
      }

      setFiles([]);
      setProgress(null);
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

        {progress !== null && (
          <div className="text-sm text-gray-700">
            Upload progress: {progress}%
          </div>
        )}
      </div>

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
