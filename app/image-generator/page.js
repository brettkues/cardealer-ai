"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [vehicleUrl, setVehicleUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup() {
    setError("");
    setImages([]);
    setSelectedImages([]);

    if (!vehicleUrl) {
      setError("Vehicle URL is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lookupVehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: vehicleUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Vehicle lookup failed");
      }

      if (!Array.isArray(data.images) || data.images.length === 0) {
        throw new Error("No images returned");
      }

      setImages(data.images);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleImage(src) {
    setSelectedImages((prev) => {
      if (prev.includes(src)) {
        return prev.filter((i) => i !== src);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, src];
    });
  }

  function handleFinishBuild() {
    if (selectedImages.length !== 4) {
      setError("You must select exactly 4 images.");
      return;
    }

    // TEMP: confirm payload before wiring build API
    console.log("FINAL BUILD PAYLOAD", {
      vehicleUrl,
      caption,
      selectedImages
    });

    alert("Image selection complete. Ready for final image build.");
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Image Generator
      </h1>

      {error && (
        <div className="mb-4 text-red-600">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block font-medium mb-1">
          Vehicle URL
        </label>
        <input
          type="text"
          value={vehicleUrl}
          onChange={(e) => setVehicleUrl(e.target.value)}
          className="w-full border p-3 rounded"
          placeholder="Paste vehicle URL here"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">
          Caption
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border p-3 rounded"
          placeholder="Optional caption"
        />
      </div>

      <button
        onClick={handleLookup}
        disabled={loading}
        className="mb-6 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Loading Images…" : "Build Image"}
      </button>

      {images.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-3">
            Select 4 Images
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {images.map((src) => {
              const index = selectedImages.indexOf(src);
              const isSelected = index !== -1;

              return (
                <div
                  key={src}
                  onClick={() => toggleImage(src)}
                  className={`relative cursor-pointer border rounded overflow-hidden ${
                    isSelected
                      ? "border-blue-600 ring-4 ring-blue-300"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold z-10">
                      {index + 1}
                    </div>
                  )}

                  <img
                    src={src}
                    alt="Vehicle"
                    className="w-full h-40 object-cover"
                  />
                </div>
              );
            })}
          </div>

          <button
            onClick={handleFinishBuild}
            disabled={selectedImages.length !== 4}
            className={`px-6 py-3 rounded text-white ${
              selectedImages.length === 4
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Finish Build
          </button>
        </>
      )}
    </div>
  );
}
