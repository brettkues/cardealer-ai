"use client";

import { useEffect, useState } from "react";

export default function TrainingManager() {
  const [files, setFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);

  async function loadFiles() {
    const res = await fetch("/api/train");
    const data = await res.json();
    setFiles(data.files || []);
  }

  async function upload() {
    if (!uploadFile) return;

    const form = new FormData();
    form.append("file", uploadFile);

    await fetch("/api/train", {
      method: "POST",
      body: form,
    });

    setUploadFile(null);
    loadFiles();
  }

  async function remove(id) {
    await fetch("/api/train", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    loadFiles();
  }

  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Training Manager</h1>

      <input
        type="file"
        className="mb-4"
        onChange={(e) => setUploadFile(e.target.files[0])}
      />

      <button
        onClick={upload}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6"
      >
        Upload Training File
      </button>

      <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>

      <div className="space-y-4">
        {files.map((f) => (
          <div key={f.id} className="bg-gray-100 p-4 rounded shadow">
            <div className="font-semibold">{f.name}</div>
            <a className="text-blue-600 underline" href={f.url} target="_blank">
              View
            </a>
            <button
              onClick={() => remove(f.id)}
              className="block w-full bg-red-600 text-white p-2 rounded mt-3"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
