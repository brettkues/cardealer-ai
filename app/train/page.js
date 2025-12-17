"use client";

import { useState } from "react";

export default function TrainPage() {
  const [salesFiles, setSalesFiles] = useState([]);
  const [salesText, setSalesText] = useState("");

  async function uploadSalesFiles() {
    if (!salesFiles.length) return;

    const form = new FormData();
    salesFiles.forEach(f => form.append("files", f));

    await fetch("/api/train/sales", {
      method: "POST",
      body: form
    });

    setSalesFiles([]);
    alert("Sales files uploaded");
  }

  async function uploadSalesText() {
    if (!salesText.trim()) return;

    const blob = new Blob([salesText], { type: "text/plain" });
    const form = new FormData();
    form.append("files", blob, "manual-sales-training.txt");

    await fetch("/api/train/sales", {
      method: "POST",
      body: form
    });

    setSalesText("");
    alert("Sales text trained");
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train Sales AI</h1>

      <div className="space-y-8">

        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">
            Upload Sales Files (Multiple / Folder)
          </h2>

          <input
            type="file"
            multiple
            webkitdirectory="true"
            directory="true"
            onChange={(e) => setSalesFiles(Array.from(e.target.files))}
          />

          {salesFiles.length > 0 && (
            <div className="text-sm text-gray-600 mt-2">
              {salesFiles.length} files selected
            </div>
          )}

          <button
            onClick={uploadSalesFiles}
            className="mt-3 w-full bg-blue-600 text-white p-3 rounded"
          >
            Upload Sales Files
          </button>
        </div>

        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">
            Paste Sales Knowledge
          </h2>

          <textarea
            className="w-full p-3 border rounded"
            rows={6}
            placeholder="Paste dealership sales processes, scripts, objections, rules, etc."
            value={salesText}
            onChange={(e) => setSalesText(e.target.value)}
          />

          <button
            onClick={uploadSalesText}
            className="mt-3 w-full bg-green-600 text-white p-3 rounded"
          >
            Train from Text
          </button>
        </div>

      </div>
    </div>
  );
}
