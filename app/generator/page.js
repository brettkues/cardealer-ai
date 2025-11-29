"use client";
import { useState } from "react";

export default function GeneratorPage() {
  const [url, setUrl] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchImages() {
    setLoading(true);
    setImages([]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
console.log("API Response:", data);

      if (data.images) {
        setImages(data.images);
      } else {
        alert("No images found.");
      }
    } catch (err) {
      alert("Error fetching images.");
    }

    setLoading(false);
  }

  return (
    <div className="p-10 text-xl">
      <h1 className="text-3xl font-bold mb-6">Image Generator</h1>

      <input
        type="text"
        placeholder="https://www.pischkenissan.com/used-cars"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="border p-3 w-full max-w-xl rounded mb-6"
      />

      <button
        onClick={fetchImages}
        className="bg-blue-600 text-white px-6 py-3 rounded"
      >
        {loading ? "Fetching..." : "Fetch Images"}
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {images.map((src, i) => (
          <img key={i} src={src} className="w-full h-auto border" />
        ))}
      </div>
    </div>
  );
}
