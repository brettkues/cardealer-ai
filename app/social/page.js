"use client";

import { useEffect, useState } from "react";

export default function SocialGenerator() {
  const [websites, setWebsites] = useState([]);
  const [selected, setSelected] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collage, setCollage] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => {
    async function loadSites() {
      const res = await fetch("/api/websites");
      const data = await res.json();
      setWebsites(data.websites || []);
    }
    loadSites();
  }, []);

  async function scrape() {
    if (!selected) return;

    setLoading(true);
    const res = await fetch("/api/scraper", {
      method: "POST",
      body: JSON.stringify({ url: selected }),
    });

    const data = await res.json();
    setVehicles(data.vehicles || []);
    localStorage.setItem("scrapedVehicles", JSON.stringify(data.vehicles || []));
    setLoading(false);
  }

  async function makeCollage(v) {
    const res = await fetch("/api/collage", {
      method: "POST",
      body: JSON.stringify({
        images: v.photos.slice(0, 4),
        ribbonText: text || `${v.year} ${v.make} ${v.model}`,
      }),
    });

    const data = await res.json();
    setCollage(data.image);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Social Image Generator</h1>

      <select
        className="w-full p-3 border rounded mb-3"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Select Website</option>
        {websites.map((w) => (
          <option key={w.id} value={w.url}>
            {w.label}
          </option>
        ))}
      </select>

      <button
        onClick={scrape}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-6"
      >
        {loading ? "Scraping..." : "Load Vehicles"}
      </button>

      <input
        className="w-full p-3 border rounded mb-6"
        placeholder="Ribbon text (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="p-4 bg-white shadow rounded cursor-pointer"
            onClick={() => makeCollage(v)}
          >
            <div className="font-semibold">
              {v.year} {v.make} {v.model}
            </div>
            {v.photos[0] && (
              <img
                src={v.photos[0]}
                className="w-full h-32 object-cover rounded mt-2"
              />
            )}
          </div>
        ))}
      </div>

      {collage && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">Generated Image</h2>
          <img src={collage} className="w-full rounded shadow" />
          <a
            href={collage}
            download="social-image.png"
            className="mt-4 block w-full text-center bg-green-600 text-white p-3 rounded"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}
