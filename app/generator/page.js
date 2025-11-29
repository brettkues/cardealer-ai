"use client";
import { useState } from "react";

export default function GeneratorPage() {
  const [url, setUrl] = useState("");
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchImages() {
    setLoading(true);
    setImages([]);
    setSelected([]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      console.log("API Response:", data);

      if (data.images && data.images.length > 0) {
        setImages(data.images);
      } else {
        alert("No vehicle images found on that page.");
      }
    } catch (err) {
      alert("Error fetching images.");
    }

    setLoading(false);
  }

  function toggleSelect(src) {
    setSelected((prev) => {
      if (prev.includes(src)) {
        return prev.filter((img) => img !== src);
      }
      if (prev.length < 4) {
        return [...prev, src];
      }
      alert("You can only select 4 images.");
      return prev;
    });
  }

  return (
    <div className="p-10 text-xl">
      <h1 className="text-3xl font-bold mb-6">Image Generator</h1>

      <input
        type="text"
        placeholder="https://www.pischkemotorsoflacrosse.com/used-car-page"
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

      {/* IMAGE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {images.map((src, i) => {
          const isSelected = selected.includes(src);
          return (
            <div
              key={i}
              onClick={() => toggleSelect(src)}
              className={`cursor-pointer border-4 ${
                isSelected ? "border-blue-600" : "border-transparent"
              }`}
            >
              <img src={src} className="w-full h-auto" />
            </div>
          );
        })}
      </div>

      {/* COLLAGE BUTTON */}
      {selected.length === 4 && (
        <button className="bg-green-600 text-white px-6 py-3 rounded mt-6">
          Build Collage
        </button>
      )}
    </div>
  );
}
