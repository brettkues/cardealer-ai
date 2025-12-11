"use client";

import { useState, useEffect } from "react";

export default function TrainingManager() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function loadFiles() {
    const res = await fetch("/api/train");
    const data = await res.json();
    setFiles(data.files || []);
  }

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    await fetch("/api/train", {
      method: "POST",
      body: form,
    });

    await loadFiles();
    setUploading(false);
  }

  async function deleteFile(id) {
    await fetch("/api/train", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    await loadFiles();
  }

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Training Manager</h1>

      <input
        type="file"
        onChange={uploadFile}
        className="mb-4"
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}

      <div className="space-y-3">
        {files.map((f) => (
          <div
            key={f.id}
            className="p-3 border rounded flex justify-between items-center bg-gray-50"
          >
            <div>
              <div className="font-semibold">{f.name}</div>
              <a href={f.url} target="_blank" className="text-blue-600 underline">
                View
              </a>
            </div>

            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => deleteFile(f.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
