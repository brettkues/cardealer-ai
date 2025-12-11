"use client";

import { useState } from "react";

export default function VehiclesPage() {
  const [url, setUrl] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  async function scrape() {
    if (!url.trim()) return;

    setLoading(true);

    const res = await fetch("/api/scraper", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    setVehicles(data.vehicles || []);

    setLoading(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Vehicle Browser</h1>

      <input
        className="w-full p-3 border rounded mb-3"
        placeholder="Enter website URL to scrape"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={scrape}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-6"
      >
        {loading ? "Scraping..." : "Scrape"}
      </button>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <a
            key={v.id}
            href={`/vehicles/${v.id}`}
            className="p-4 bg-white shadow rounded"
          >
            <div className="font-bold">
              {v.year} {v.make} {v.model}
            </div>

            {v.photos[0] && (
              <img
                src={v.photos[0]}
                className="w-full h-32 object-cover rounded mt-2"
                alt=""
              />
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
