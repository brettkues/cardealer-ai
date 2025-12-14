"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ImageSelectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const vin = searchParams.get("vin");

  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vin) {
      setError("Missing VIN");
      setLoading(false);
      return;
    }

    async function fetchImages() {
      try {
        const res = await fetch("/api/lookupVehicle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ vin })
        });

        const text = await res.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("lookupVehicle returned non-JSON response");
        }

        if (!res.ok) {
          throw new Error(data.error || "lookupVehicle failed");
        }

        if (!Array.isArray(data.images)) {
          throw new Error("No images returned from lookupVehicle");
        }

        setAvailableImages(data.images);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, [vin]);

  function toggleImage(src) {
    setError("");

    setSelectedImages((prev) => {
      if (prev.includes(src)) {
        return prev.filter((img) => img !== src);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, src];
    });
  }

  function handleContinue() {
    if (selectedImages.length !== 4) {
      setError("You must select exactly 4 images.");
      return;
    }

    router.push(`/build-image?vin=${vin}`);
  }

  if (loading) {
    return <div className="p-6">Loading images…</div>;
  }

  if (error && availableImages.length === 0) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Select 4 Images
      </h1>

      <p className="mb-4 text-gray-600">
        Click images to select or unselect. Order matters.
      </p>

      {error && (
        <div className="mb-4 text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {availableImages.map((src) => {
          const index = selectedImages.indexOf(src);
          const isSelected = index !== -1;

          return (
            <div
              key={src}
              className={`relative cursor-pointer border rounded overflow-hidden ${
                isSelected
                  ? "border-blue-600 ring-4 ring-blue-300"
                  : "border-gray-300"
              }`}
              onClick={() => toggleImage(src)}
            >
              {isSelected && (
                <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
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
        onClick={handleContinue}
        disabled={selectedImages.length !== 4}
        className={`px-6 py-3 rounded text-white ${
          selectedImages.length === 4
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Continue to Build Image
      </button>
    </div>
  );
}
