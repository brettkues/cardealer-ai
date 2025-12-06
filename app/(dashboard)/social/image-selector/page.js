"use client";

import { useState } from "react";

export default function ImageSelectorPage() {
  const [images, setImages] = useState([
    // Placeholder previews — replaced once scraper is active
    "/placeholder1.jpg",
    "/placeholder2.jpg",
    "/placeholder3.jpg",
    "/placeholder4.jpg",
    "/placeholder5.jpg",
    "/placeholder6.jpg",
    "/placeholder7.jpg",
    "/placeholder8.jpg",
    "/placeholder9.jpg",
    "/placeholder10.jpg"
  ]);

  const [selected, setSelected] = useState([]);

  function toggleSelect(url) {
    if (selected.includes(url)) {
      setSelected(selected.filter((i) => i !== url));
    } else {
      if (selected.length >= 4) return; // limit 4 images
      setSelected([...selected, url]);
    }
  }

  async function continueToRibbon() {
    if (selected.length !== 4) return;

    // Save selection into local storage
    localStorage.setItem("selectedImages", JSON.stringify(selected));

    // Redirect to next step
    window.location.href = "/dashboard/social/ribbon";
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Select 4 Images</h1>

      <p className="mb-4 text-gray-600">
        Choose exactly 4 images for your social media collage.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {images.map((url, idx) => (
          <div
            key={idx}
            onClick={() => toggleSelect(url)}
            className={`cursor-pointer border-4 rounded-lg overflow-hidden ${
              selected.includes(url)
                ? "border-blue-600"
                : "border-transparent"
            }`}
          >
            <img src={url} className="w-full h-40 object-cover" />
          </div>
        ))}
      </div>

      <button
        onClick={continueToRibbon}
        className={`w-full mt-6 py-3 rounded text-white transition ${
          selected.length === 4
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Continue (4 Selected Required)
      </button>
    </div>
  );
}
