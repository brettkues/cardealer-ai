"use client";

import { useEffect, useState } from "react";

export default function VehiclesPage() {
  const [websites, setWebsites] = useState([]);
  const [url, setUrl] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadWebsites() {
    const res = await fetch("/api/websites");
    const data = await res.json();
    setWebsites(data.websites || []);
  }

  async function runScraper() {
    if (!url) return;

    setLoading(true);
    setVehicles([]);

    const res = await fetch("/api/scraper", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    setVehicles(data.vehicles || []);

    sessionStorage.setItem(
      "scrapedVehicles",
      JSON.stringify(data.vehicles || [])
    );

    setLoading(false);
  }

  useEffect(() => {
    loadWebsites();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Vehicle Browser</h1>

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

      <button
        onClick={runScraper}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6"
      >
        Scrape Inventory
      </button>

      {loading && <p className="mb-4">Loading...</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {vehicles.map((v, i) => (
          <a
            key={i}
            href={`/vehicles/${i}`}
            className="block bg-gray-50 rounded shadow hover:shadow-lg transition"
          >
            {v.photos?.[0] ? (
              <img
                src={v.photos[0]}
                alt=""
                className="w-full h-40 object-cover rounded-t"
              />
            ) : (
              <div className="w-full h-40 bg-gray-300 flex items-center justify-center text-sm">
                No Image
              </div>
            )}
            <div className="p-3 text-center">
              <div className="font-bold">{v.year}</div>
              <div>{v.make}</div>
              <div className="text-gray-600 text-sm">{v.model}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
