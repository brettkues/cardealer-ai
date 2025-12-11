"use client";

import { useEffect, useState } from "react";
import { storage } from "../../../lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function TrainingManager() {
  const [files, setFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadFiles() {
    const res = await fetch("/api/train");
    const data = await res.json();
    setFiles(data.files || []);
  }

  useEffect(() => {
    loadFiles();
  }, []);

  async function handleUpload() {
    if (!uploadFile) return;

    setLoading(true);

    try {
      const path = `training/${Date.now()}-${uploadFile.name}`;
      const storageRef = ref(storage, path);

      // Upload file bytes
      const snapshot = await uploadBytes(storageRef, uploadFile);

      // Get public URL
      const url = await getDownloadURL(snapshot.ref);

      // Save metadata
      await fetch("/api/train", {
        method: "POST",
        body: JSON.stringify({
          name: uploadFile.name,
          url,
        }),
      });

      setUploadFile(null);
      await loadFiles();
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id, url) {
    setLoading(true);

    try {
      // Remove from storage
      const decoded = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      const fileRef = ref(storage, decoded);

      try {
        await deleteObject(fileRef);
      } catch (err) {
        // Ignore if file is already gone
      }

      // Remove Firestore entry
      await fetch("/api/train", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });

      await loadFiles();
    } finally {
      setLoading(false);
    }
  }

  function iconForFile(name) {
    const ext = name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📄";
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "🎥";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["ppt", "pptx"].includes(ext)) return "📊";
    return "📁";
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Training Manager</h1>

      <input
        type="file"
        className="mb-3"
        onChange={(e) => setUploadFile(e.target.files[0])}
      />

      <button
        onClick={handleUpload}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload File"}
      </button>

      <h2 className="text-xl font-bold mb-3">Training Files</h2>

      {files.length === 0 && <p>No training files uploaded yet.</p>}

      <div className="space-y-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="p-3 border rounded flex justify-between items-center bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{iconForFile(f.name)}</span>
              <a
                className="text-blue-700 underline"
                href={f.url}
                target="_blank"
              >
                {f.name}
              </a>
            </div>

            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => deleteItem(f.id, f.url)}
              disabled={loading}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
