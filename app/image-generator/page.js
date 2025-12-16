"use client";

import { useState } from "react";
import Link from "next/link";
import LogoPicker from "./LogoPicker";

export default function ImageGeneratorPage() {
  const [vehicleUrl, setVehicleUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [logos, setLogos] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [finalImage, setFinalImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openLogos, setOpenLogos] = useState(false);

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
        body: JSON.stringify({ url: vehicleUrl }),
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
      if (prev.includes(src)) return prev.filter((i) => i !== src);
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
      const logoUrls = logos.map((l) => l.url);

      const buildRes = await fetch("/api/buildImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: selectedImages,
          caption,
          logos: logoUrls,
        }),
      });

      const built = await buildRes.json();
      if (!buildRes.ok) throw new Error(built.error);

      const blob = await (await fetch(built.output)).blob();

      const urlRes = await fetch("/api/getUploadUrl", { method: "POST" });
      const urlData = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlData.error);

      const uploadRes = await fetch(urlData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });

      if (!uploadRes.ok) throw new Error("Image upload failed.");
      setFinalImage(urlData.publicUrl);
    } catch (err) {
      setError(err.message || "Image build failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!finalImage) return;
    const res = await fetch(finalImage);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicle-image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleNativeShare() {
    if (!finalImage || !navigator.share) return;
    try {
      const res = await fetch(finalImage);
      const blob = await res.blob();
      const file = new File([blob], "vehicle-image.png", { type: "image/png" });

      await navigator.share({
        files: [file],
        title: "Vehicle Image",
        text: "Check out this vehicle",
      });
    } catch {}
  }

  function handleFacebookShare() {
    if (!finalImage) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        finalImage
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function resetAll() {
    setVehicleUrl("");
    setCaption("");
    setLogos([]);
    setImages([]);
    setSelectedImages([]);
    setFinalImage(null);
    setError("");
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Image Generator</h1>

      {error && (
        <div className="mb-4 text-red-600 font-medium">{error}</div>
      )}

      {!finalImage && (
        <>
          <div className="mb-4">
            <label className="block font-medium mb-1">Vehicle URL</label>
            <input
              className="w-full border p-3 rounded"
              value={vehicleUrl}
              onChange={(e) => setVehicleUrl(e.target.value)}
              placeholder="Paste the URL from the vehicle listing page"
            />
            <p className="text-sm text-gray-600 mt-1">
              Paste the URL from the vehicle’s listing page on your website.
            </p>
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-1">Caption</label>
            <input
              className="w-full border p-3 rounded"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block font-medium mb-1">Logos (optional)</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpenLogos(true)}
                className="px-4 py-2 bg-gray-700 text-white rounded"
              >
                Select Logos ({logos.length}/3)
              </button>

              <Link
                href="/image-generator/logos"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded border"
              >
                Manage Logos
              </Link>
            </div>

            {logos.length > 0 && (
              <div className="mt-2 flex gap-2">
                {logos.map((l) => (
                  <div key={l.id} className="border rounded p-1">
                    <img src={l.url} className="h-12 object-contain" />
                  </div>
                ))}
              </div>
            )}
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
              <button
                onClick={handleFinishBuild}
                disabled={loading || selectedImages.length !== 4}
                className="mb-4 px-6 py-3 bg-green-600 text-white rounded"
              >
                {loading ? "Building…" : "Finish Build"}
              </button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {images.map((src) => {
                  const index = selectedImages.indexOf(src);
                  const selected = index !== -1;

                  return (
                    <div
                      key={src}
                      onClick={() => toggleImage(src)}
                      className={`relative cursor-pointer border rounded ${
                        selected ? "ring-4 ring-blue-300" : ""
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                      )}
                      <img
                        src={src}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {finalImage && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-3">Final Image</h2>
          <img
            src={finalImage}
            className="border rounded max-w-full mb-6"
          />

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-gray-700 text-white rounded"
            >
              Download Image
            </button>

            <button
              onClick={handleNativeShare}
              className="px-6 py-3 bg-blue-600 text-white rounded"
            >
              Share Image
            </button>

            <button
              onClick={handleFacebookShare}
              className="px-6 py-3 bg-blue-700 text-white rounded"
            >
              Share on Facebook
            </button>

            <button
              onClick={resetAll}
              className="px-6 py-3 bg-gray-600 text-white rounded"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      <LogoPicker
        open={openLogos}
        onClose={() => setOpenLogos(false)}
        onSelect={setLogos}
        selected={logos}
        maxSelect={3}
        canDelete={false}
      />
    </div>
  );
}
