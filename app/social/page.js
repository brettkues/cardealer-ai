"use client";

import { useEffect, useState } from "react";

export default function SocialImageGenerator() {
  const [websites, setWebsites] = useState([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [finalImage, setFinalImage] = useState(null);

  const [vehicle, setVehicle] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("collageSource");
    if (stored) {
      const v = JSON.parse(stored);

      const best = v.photos?.slice(0, 4) || [];

      setVehicle(v);
      setSelectedPhotos(best);
    }
  }, []);

  async function loadWebsites() {
    const res = await fetch("/api/websites");
    const data = await res.json();
    setWebsites(data.websites || []);
  }

  useEffect(() => {
    loadWebsites();
  }, []);

  async function generateCollage() {
    const res = await fetch("/api/collage", {
      method: "POST",
      body: JSON.stringify({
        url,
        text,
        photos: selectedPhotos,
        year: vehicle?.year,
        make: vehicle?.make,
        model: vehicle?.model,
      }),
    });

    const data = await res.json();
    setFinalImage(data.image || null);
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Social Image Generator</h1>

      {vehicle && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {selectedPhotos.map((p, i) => (
              <img
                key={i}
                src={p}
                className="w-full h-32 object-cover rounded shadow"
              />
            ))}
          </div>
        </div>
      )}

      <select
        className="w-full p-3 border rounded mb-3"
        onChange={(e) => setUrl(e.target.value)}
      >
        <option value="">Select a saved website...</option>
        {websites.map((site) => (
          <option key={site.id} value={site.url}>
            {site.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Or enter a URL manually..."
        className="w-full p-3 border rounded mb-3"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <textarea
        placeholder="Banner text..."
        className="w-full p-3 border rounded mb-3 h-24"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={generateCollage}
        className="w-full bg-purple-600 text-white p-3 rounded mb-6"
      >
        Generate Collage
      </button>

      {finalImage && (
        <img
          src={finalImage}
          className="w-full rounded shadow"
          alt="Generated"
        />
      )}
    </div>
  );
}
