"use client";

import { useEffect, useState } from "react";

export default function VehicleDetail({ params }) {
  const { id } = params;
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("scrapedVehicles") || "[]");
    const found = saved.find((v) => v.id === id);
    setVehicle(found || null);
  }, [id]);

  if (!vehicle) return <div className="p-6">Vehicle not found.</div>;

  async function createCollage() {
    const res = await fetch("/api/collage", {
      method: "POST",
      body: JSON.stringify({
        images: vehicle.photos.slice(0, 4),
        ribbonText: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      }),
    });

    const data = await res.json();
    const link = document.createElement("a");
    link.href = data.image;
    link.download = "collage.png";
    link.click();
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {vehicle.photos.map((src, i) => (
          <img
            key={i}
            src={src}
            className="w-full h-48 object-cover rounded shadow"
          />
        ))}
      </div>

      <button
        onClick={createCollage}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded shadow"
      >
        Create Collage
      </button>
    </div>
  );
}
