"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null);

  async function handleGenerate() {
    setStatus("Gathering images…");
    setPreview(null);

    const res = await fetch("/api/social/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });

    const data = await res.json();
    setStatus(data.message || "Working…");

    // real image preview generation will be added later
    setPreview("placeholder");
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Social Image Generator</h1>

      <div className="space-y-4">

        {/* Stock Number */}
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="Enter Stock Number or last 8 of VIN"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
        >
          Generate Images
        </button>

        {/* Status */}
        {status && <p className="text-gray-600">{status}</p>}

        {/* Placeholder Preview */}
        {preview && (
          <div className="mt-6 p-6 bg-white border rounded shadow text-center">
            Image preview placeholder  
            <br />
            (Full collage system activates after UI build)
          </div>
        )}
      </div>
    </div>
  );
}
