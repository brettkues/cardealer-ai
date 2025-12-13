"use client";

import { useState } from "react";

export default function ImageGenerator() {
  const [manualURL, setManualURL] = useState("");
  const [caption, setCaption] = useState("");
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generateImage() {
    setLoading(true);
    setResultImage(null);

    if (!manualURL.trim()) {
      alert("Please enter a full vehicle URL.");
      setLoading(false);
      return;
    }

    // STEP 1 — LOOKUP VEHICLE
    const lookupRes = await fetch("/api/lookupVehicle", {
      method: "POST",
      body: JSON.stringify({ url: manualURL.trim() }),
    });

    const vehicleData = await lookupRes.json();

    if (vehicleData.error) {
      alert(vehicleData.error);
      setLoading(false);
      return;
    }

    // STEP 2 — BUILD IMAGE
    const buildRes = await fetch("/api/buildImage", {
      method: "POST",
      body: JSON.stringify({
        images: vehicleData.images,
        caption,
        logos: [],
      }),
    });

    const result = await buildRes.json();

    // IMPORTANT: API RETURNS images[]
    if (result.images && result.images.length > 0) {
      setResultImage(result.images[0]);
    } else {
      alert("Image build failed.");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Image Generator</h1>

      {/* VEHICLE URL */}
      <div>
        <label className="font-semibold">Full Vehicle URL</label>
        <input
          type="text"
          className="w-full p-3 border rounded mt-1"
          placeholder="https://www.pischkenissan.com/used-..."
          value={manualURL}
          onChange={(e) => setManualURL(e.target.value)}
        />
      </div>

      {/* CAPTION */}
      <div>
        <label className="font-semibold">Caption</label>
        <input
          className="w-full p-3 border rounded mt-1"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      {/* GENERATE */}
      <button
        onClick={generateImage}
        className="w-full bg-blue-600 text-white p-4 rounded text-lg"
      >
        Generate Image
      </button>

      {loading && <p className="text-center">Generating…</p>}

      {resultImage && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <img src={resultImage} className="w-full rounded shadow" />
        </div>
      )}
    </div>
  );
}
