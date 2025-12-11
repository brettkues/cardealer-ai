"use client";

import { useState } from "react";

export default function TrainPage() {
  const [salesFiles, setSalesFiles] = useState([]);
  const [fiFiles, setFIFiles] = useState([]);

  async function uploadFiles(files, route) {
    const form = new FormData();
    for (let f of files) form.append("files", f);

    await fetch(route, {
      method: "POST",
      body: form
    });

    alert("Training data uploaded.");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train Your AI</h1>

      <div className="space-y-8">

        {/* SALES TRAINING */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Sales Training</h2>

          <input
            type="file"
            multiple
            onChange={(e) => setSalesFiles(Array.from(e.target.files))}
          />

          <button
            onClick={() => uploadFiles(salesFiles, "/api/train/sales")}
            className="mt-3 w-full bg-blue-600 text-white p-3 rounded"
          >
            Upload Sales Training
          </button>
        </div>

        {/* F&I TRAINING */}
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">F&I Training</h2>

          <input
            type="file"
            multiple
            onChange={(e) => setFIFiles(Array.from(e.target.files))}
          />

          <button
            onClick={() => uploadFiles(fiFiles, "/api/train/fi")}
            className="mt-3 w-full bg-green-600 text-white p-3 rounded"
          >
            Upload F&I Training
          </button>
        </div>

      </div>
    </div>
  );
}
