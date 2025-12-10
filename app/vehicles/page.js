"use client";

import { useState } from "react";

export default function VehiclesPage() {
  const [url, setUrl] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  async function runScraper() {
    setLoading(true);
    setVehicles([]);

    const res = await fetch("/api/scraper", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    // Save for detail view
    sessionStorage.setItem(
      "scrapedVehicles",
      JSON.stringify(data.vehicles || [])
    );

    setVehicles(data.vehicles || []);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Vehicle Browser</h1>

      <input
        type="text"
        placeholder="Enter inventory URL..."
        className="w-full p-3 border rounded mb-4"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={runScraper}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Scrape Inventory
      </button>

      {loading && (
        <p className="mt-4 text-gray-600 text-lg">Loading...</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {vehicles.map((v, i) => (
          <a
            key={i}
            href={`/vehicles/${i}`}
            className="block bg-white shadow rounded overflow-hidden hover:shadow-lg transition"
          >
            {v.photos && v.photos[0] ? (
              <img
                src={v.photos[0]}
                className="w-full h-40 object-cover"
                alt=""
              />
            ) : (
              <div className="w-full h-40 bg-gray-300 flex items-center justify-center">
                No Image
              </div>
            )}

            <div className="p-3 text-center">
              <div className="font-bold">{v.year}</div>
              <div>{v.make}</div>
              <div className="text-gray-600">{v.model}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
