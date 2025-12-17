"use client";

import { useState } from "react";

export default function TrainPage() {
  const [salesFiles, setSalesFiles] = useState([]);

  async function uploadSalesFiles() {
    alert("BUTTON CLICKED");

    if (!salesFiles.length) {
      alert("NO FILES SELECTED");
      return;
    }

    alert(`FILES COUNT: ${salesFiles.length}`);
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

        <button
          type="button"
          onClick={uploadSalesFiles}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          Upload Sales Files
        </button>
      </div>
    </div>
  );
}
