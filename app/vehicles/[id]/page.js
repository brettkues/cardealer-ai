"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VehicleDetail({ params }) {
  const [vehicles, setVehicles] = useState([]);
  const id = parseInt(params.id);

  useEffect(() => {
    const saved = sessionStorage.getItem("scrapedVehicles");
    if (saved) {
      setVehicles(JSON.parse(saved));
    }
  }, []);

  const v = vehicles[id];

  if (!v) {
    return <p className="p-4">Vehicle not found.</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">
        {v.year} {v.make} {v.model}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {v.photos.map((p, i) => (
          <img
            key={i}
            src={p}
            className="w-full h-48 object-cover shadow rounded"
            alt=""
          />
        ))}
      </div>

      <a
        href="/vehicles"
        className="mt-6 inline-block px-4 py-2 bg-gray-700 text-white rounded"
      >
        Back
      </a>
    </div>
  );
}
