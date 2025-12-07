"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImageSelectorPage() {
  const router = useRouter();

  const [stock, setStock] = useState("");
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState("");

  // Load dealership websites
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/social/get-websites");
      const data = await res.json();
      setWebsites(data.websites || []);
    };
    load();
  }, []);

  // Scrape the vehicle images
  const scrapeImages = async () => {
    if (!selectedWebsite || !stock.trim()) return;

    setStatus("Scraping images…");

    const url = `${selectedWebsite}/used-${stock}`;

    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!data.images) {
      setStatus("No images found.");
      return;
    }

    setImages(data.images);
    setStatus("");
  };

  // Select / deselect images (max 4)
  const toggle = (img) => {
    setSelected((prev) =>
      prev.includes(img)
        ? prev.filter((i) => i !== img)
        : prev.length < 4
        ? [...prev, img]
        : prev
    );
  };

  const continueToGenerate = () => {
    if (selected.length !== 4) return;
    localStorage.setItem("selectedImages", JSON.stringify(selected));
    router.push("/dashboard/social/image-generator");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Select Images</h1>

      <div className="space-y-4 max-w-xl">
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="Enter stock number or last 8 of VIN…"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <select
          className="w-full p-3 border rounded"
          value={selectedWebsite}
          onChange={(e) => setSelectedWebsite(e.target.value)}
        >
          <option value="">Select dealership website…</option>
          {websites.map((w, i) => (
            <option key={i} value={w.url}>
              {w.url}
            </option>
          ))}
        </select>

        <button
          onClick={scrapeImages}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Scrape Images
        </button>

        <p>{status}</p>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {images.map((src, i) => (
          <div
            key={i}
            className={`border rounded overflow-hidden cursor-pointer ${
              selected.includes(src) ? "ring-4 ring-blue-500" : ""
            }`}
            onClick={() => toggle(src)}
          >
            <img src={src} className="w-full h-32 object-cover" />
          </div>
        ))}
      </div>

      {/* Continue button */}
      {selected.length === 4 && (
        <button
          onClick={continueToGenerate}
          className="mt-6 bg-green-600 text-white py-3 px-6 rounded hover:bg-green-700 transition"
        >
          Continue to Image Generator
        </button>
      )}
    </div>
  );
}
