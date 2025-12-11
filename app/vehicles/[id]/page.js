"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VehicleDetail({ params }) {
  const { id } = params;
  const router = useRouter();

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

  const createCollage = () => {
    sessionStorage.setItem("collageSource", JSON.stringify(vehicle));
    router.push("/social");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {vehicle.photos?.map((p, i) => (
          <img
            key={i}
            src={p}
            className="w-full h-48 object-cover rounded shadow"
            alt=""
          />
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={createCollage}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow"
        >
          Create Collage
        </button>

        <a
          href="/vehicles"
          className="px-4 py-2 bg-gray-700 text-white rounded shadow"
        >
          Back
        </a>
      </div>
    </div>
  );
}
