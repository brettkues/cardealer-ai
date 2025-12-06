"use client";

import { useState } from "react";

export default function ImageSelectorPage() {
  const [url, setUrl] = useState("");
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");

  const scrapeImages = async () => {
    if (!url.trim()) return;

    setMessage("Scraping images…");

    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    setImages(data.images || []);
    setMessage("");
  };

  const toggleSelect = (img) => {
    if (selected.includes(img)) {
      setSelected(selected.filter((x) => x !== img));
    } else if (selected.length < 4) {
      setSelected([...selected, img]);
    }
  };

  const sendToGenerator = async () => {
    if (selected.length !== 4) return;

    localStorage.setItem("selectedImages", JSON.stringify(selected));
    window.location.href = "/dashboard/social/image-generator";
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Image Selector</h1>

      <div className="max-w-xl space-y-4 mb-6">
        <input
          type="text"
          placeholder="Paste vehicle URL…"
          className="w-full p-3 border rounded"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={scrapeImages}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Fetch Images
        </button>

        {message && <p>{message}</p>}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            className={`w-full h-32 object-cover border-4 cursor-pointer ${
              selected.includes(src)
                ? "border-blue-600"
                : "border-transparent"
            }`}
            onClick={() => toggleSelect(src)}
          />
        ))}
      </div>

      {selected.length === 4 && (
        <button
          onClick={sendToGenerator}
          className="mt-6 bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 transition"
        >
          Continue to Generator
        </button>
      )}
    </div>
  );
}
