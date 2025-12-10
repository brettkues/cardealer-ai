"use client";

import { useEffect, useState } from "react";

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
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Vehicle Not Found</h1>
        <a
          href="/vehicles"
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Back
        </a>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        {v.year} {v.make} {v.model}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {v.photos.map((p, i) => (
          <img
            key={i}
            src={p}
            className="w-full h-48 object-cover rounded shadow"
            alt=""
          />
        ))}
      </div>

      <a
        href="/vehicles"
        cla
