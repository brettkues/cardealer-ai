"use client";

import { useState } from "react";

export default function TrainPage() {
  const [salesFiles, setSalesFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function uploadSalesFiles() {
    if (!salesFiles.length) {
      alert("No files selected");
      return;
    }

    setLoading(true);
    setStatus("Uploading and training… this can take a minute.");

    try {
      const form = new FormData();
      salesFiles.forEach(f => form.append("files", f));

      const res = await fetch("/api/train/sales", {
        method: "POST",
        body: form
      });

      const data = await res.json();

      setStatus("Files uploaded successfully. Processing has started and may take several minutes.");

      setSalesFiles([]);
    } catch (err) {
      setStatus("Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train Sales AI</h1>

      <div className="border rounded p-4 space-y-4">
        <input
          type="file"
          multiple
          onChange={(e) => setSalesFiles(Array.from(e.target.files))}
        />

        {salesFiles.length > 0 && (
          <div className="text-sm text-gray-600">
            {salesFiles.length} file(s) selected
          </div>
        )}

        <button
          type="button"
          onClick={uploadSalesFiles}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
        >
          {loading ? "Training…" : "Upload Sales Files"}
        </button>

        {status && (
          <div className="text-sm text-gray-700 mt-2">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
