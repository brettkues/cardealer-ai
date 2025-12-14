"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [vehicleUrl, setVehicleUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [finalImage, setFinalImage] = useState(null);
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
      if (!res.ok) throw new Error(data.error);

      setImages(data.images);
    } catch (err) {
      setError(err.message || "Vehicle lookup failed.");
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
      setError("Select exactly 4 images.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Build final image
      const buildRes = await fetch("/api/buildImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: selectedImages,
          caption
        })
      });

      const built = await buildRes.json();
      if (!buildRes.ok) throw new Error(built.error);

      // Convert base64 → Blob
      const blob = await (await fetch(built.output)).blob();

      // 2️⃣ Get signed upload URL
      const urlRes = await fetch("/api/getUploadUrl", {
        method: "POST"
      });

      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error);

      // 3️⃣ Upload directly to storage
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "image/png"
        },
        body: blob
      });

      if (!uploadRes.ok) {
        throw new Error("Image upload failed.");
      }

      // 4️⃣ Done — show final image
      setFinalImage(urlData.publicUrl);

    } catch (err) {
      setError(err.message || "Image build failed.");
    } finally {
      setLoading(false);
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
        <div className="mb-4 text-red-600 font-medium">
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
              className="w-full border p-3 rounded"
              value={vehicleUrl}
              onChange={(e) => setVehicleUrl(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-1">
              Caption
            </label>
            <input
              className="w-full border p-3 rounded"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <button
            onClick={handleLookup}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded"
          >
            {loading ? "Loading…" : "Select Images"}
          </button>

          {images.length > 0 && (
            <>
              {/* 🔼 TOP FINISH BUILD */}
              <button
                onClick={handleFinishBuild}
                disabled={loading || selectedImages.length !== 4}
                className="mb-4 px-6 py-3 bg-green-600 text-white rounded"
              >
                {loading ? "Building…" : "Finish Build"}
              </button>

              <h2 className="text-xl font-semibold mb-3">
                Select 4 Images
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {images.map((src) => {
                  const index = selectedImages.indexOf(src);
                  const selected = index !== -1;

                  return (
                    <div
                      key={src}
                      onClick={() => toggleImage(src)}
                      className={`relative cursor-pointer border rounded overflow-hidden ${
                        selected
                          ? "border-blue-600 ring-4 ring-blue-300"
                          : "border-gray-300"
                      }`}
                    >
                      {selected && (
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

              {/* 🔽 BOTTOM FINISH BUILD */}
              <button
                onClick={handleFinishBuild}
                disabled={loading || selectedImages.length !== 4}
                className="px-6 py-3 bg-green-600 text-white rounded"
              >
                {loading ? "Building…" : "Finish Build"}
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
            alt="Final"
            className="border rounded max-w-full mb-6"
          />

          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              finalImage
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-4 px-6 py-3 bg-blue-700 text-white rounded"
          >
            Share on Facebook
          </a>

          <div>
            <button
              onClick={resetAll}
              className="px-6 py-3 bg-gray-600 text-white rounded"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
