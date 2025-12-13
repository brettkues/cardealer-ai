"use client";

import { useState } from "react";

export default function ImageGenerator() {
  const [vehicleURL, setVehicleURL] = useState("");
  const [caption, setCaption] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generateImage() {
    setLoading(true);
    setResult(null);

    if (!vehicleURL.trim()) {
      alert("Enter a vehicle URL");
      setLoading(false);
      return;
    }

    // 1️⃣ LOOKUP VEHICLE + IMAGES
    const lookupRes = await fetch("/api/lookupVehicle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: vehicleURL.trim() }),
    });

    const lookupData = await lookupRes.json();
    if (lookupData.error) {
      alert(lookupData.error);
      setLoading(false);
      return;
    }

    // FORCE EXACTLY 4 IMAGES
    const images = lookupData.images.slice(0, 4);

    // 2️⃣ BUILD IMAGE
    const buildRes = await fetch("/api/buildImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images,
        caption,
      }),
    });

    const buildData = await buildRes.json();
    if (buildData.error) {
      alert(buildData.error);
      setLoading(false);
      return;
    }

    setResult(buildData.output);
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Vehicle Image Generator</h1>

      <input
        className="w-full p-3 border rounded"
        placeholder="Paste full vehicle URL"
        value={vehicleURL}
        onChange={(e) => setVehicleURL(e.target.value)}
      />

      <input
        className="w-full p-3 border rounded"
        placeholder="Caption (optional)"
        maxLength={85}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <button
        onClick={generateImage}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-4 rounded"
      >
        {loading ? "Building..." : "Generate Image"}
      </button>

      {result && (
        <div>
          <img src={result} className="w-full rounded shadow" />
        </div>
      )}
    </div>
  );
}
