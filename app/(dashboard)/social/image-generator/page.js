"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [stock, setStock] = useState("");
  const [message, setMessage] = useState("");

  const handleGenerate = async () => {
    setMessage("Generating image preview…");

    const res = await fetch("/api/social/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });

    const data = await res.json();
    setMessage(data.message || "Done.");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Social Image Generator</h1>

      <div className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Enter stock number or last 8 of VIN"
          className="w-full p-3 border rounded"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Generate Preview
        </button>

        <p>{message}</p>
      </div>
    </div>
  );
}
