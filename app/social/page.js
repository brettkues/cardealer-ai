"use client";

import { useEffect, useState } from "react";

export default function SocialImageGenerator() {
  const [websites, setWebsites] = useState([]);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [finalImage, setFinalImage] = useState(null);
  const [vehiclePhotos, setVehiclePhotos] = useState([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("collageSource");
    if (stored) {
      const v = JSON.parse(stored);
      setVehiclePhotos(v.photos || []);
    }
  }, []);

  async function loadWebsites() {
    const res = await fetch("/api/websites");
    const data = await res.json();
    setWebsites(data.websites || []);
  }

  async function generateCollage() {
    const res = await fetch("/api/collage", {
      method: "POST",
      body: JSON.stringify({
        url,
        text,
        photos: vehiclePhotos,
      }),
    });

    const data = await res.json();
    setFinalImage(data.image || null);
  }

  useEffect(() => {
    loadWebsites();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">

      <h1 className="text-3xl font-bold mb-4">Social Image Generator</h1>

      {vehiclePhotos.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Vehicle Photos Loaded</h2>
          <div className="grid grid-cols-2 gap-2">
            {vehiclePhotos.map((p, i) => (
              <img
                key={i}
                src={p}
                className="w-full h-24 object-cover rounded shadow"
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
        placeholder="Or enter a website URL manually..."
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
