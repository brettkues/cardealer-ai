"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [stock, setStock] = useState("");
  const [message, setMessage] = useState("");

  const startPreview = async () => {
    if (!stock.trim()) return;

    const res = await fetch("/api/social/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });

    const data = await res.json();
    setMessage(data.message || "Started.");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Image Generator</h1>

      <div className="space-y-4 max-w-lg">
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="Enter Stock # or VIN"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <button
          onClick={startPreview}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Start Preview
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
