"use client";

import { useEffect, useState } from "react";

export default function VehicleDetail({ params }) {
  const { id } = params;
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("scrapedVehicles");

    if (!stored) return;

    const list = JSON.parse(stored);
    setVehicle(list[id]);
  }, [id]);

  if (!vehicle) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Vehicle Not Found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      {vehicle.photos?.[0] && (
        <img
          src={vehicle.photos[0]}
          className="w-full rounded mb-4"
          alt="Vehicle"
        />
      )}

      <div className="space-y-2">
        <p><strong>Year:</strong> {vehicle.year}</p>
        <p><strong>Make:</strong> {vehicle.make}</p>
        <p><strong>Model:</strong> {vehicle.model}</p>

        {vehicle.trim && <p><strong>Trim:</strong> {vehicle.trim}</p>}
        {vehicle.mileage && <p><strong>Mileage:</strong> {vehicle.mileage}</p>}
        {vehicle.price && <p><strong>Price:</strong> {vehicle.price}</p>}
      </div>
    </div>
  );
}
