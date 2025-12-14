"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [vehicleUrl, setVehicleUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [finalImage, setFinalImage] = useState(null); // PUBLIC URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLookup() {
    setError("");
    setImages([]);
    setSelectedImages([]);
    setFinalImage(null);

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
      if (prev.length >= 4) return prev;
      return [...prev, src];
    });
  }

  async function handleFinishBuild() {
    setError("");

    if (selectedImages.length !== 4) {
      setError("You must select exactly 4 images.");
      return;
    }

    try {
      // 1️⃣ Build image
      const buildRes = await fetch("/api/buildImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: selectedImages,
          caption
        })
      });

      const built = await buildRes.json();

      if (!buildRes.ok) {
        throw new Error(built.error || "Image build failed");
      }

      // 2️⃣ Save image to Firebase
      const saveRes = await fetch("/api/saveImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: built.output })
      });

      const saved = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saved.error || "Image save failed");
      }

      // PUBLIC URL
      setFinalImage(saved.url);
    } catch (err) {
      setError(err.message);
    }
  }

  function downloadImage() {
    const link = document.createElement("a");
    link.href = finalImage;
    link.download = "vehicle-image.png";
    link.click();
  }

  async function shareImage() {
    if (!navigator.share) {
      alert("Sharing not supported on this device.");
      return;
    }

    try {
      await navigator.share({
        title: "Vehicle Image",
        text: caption || "Check out this vehicle",
        url: finalImage
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  }

  function resetAll() {
    setVehicleUrl("");
    setCaption("");
    setImages([]);
    setSelectedImages([]);
    setFinalImage(null);
    setError("");
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

      {!finalImage && (
        <>
          <div className="mb-4">
            <label className="block font-medium mb-1">
              Vehicle URL
            </label>
            <input
              type="text"
              value={vehicleUrl}
              onChange={(e) => setVehicleUrl(e.target.value)}
              className="w-full border p-3 rounded"
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
            />
          </div>

          <button
            onClick={handleLookup}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded"
          >
            {loading ? "Loading Images…" : "Select 4 Images"}
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
                        <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
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
                className="px-6 py-3 bg-green-600 text-white rounded"
              >
                Finish Build
              </button>
            </>
          )}
        </>
      )}

      {finalImage && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">
            Final Image
          </h2>

          <img
            src={finalImage}
            alt="Generated"
            className="border rounded max-w-full mb-6"
          />

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={downloadImage}
              className="px-5 py-3 bg-blue-600 text-white rounded"
            >
              Download
            </button>

            <button
              onClick={shareImage}
              className="px-5 py-3 bg-purple-600 text-white rounded"
            >
              Share (Text)
            </button>

            <button
              onClick={resetAll}
              className="px-5 py-3 bg-gray-500 text-white rounded"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
