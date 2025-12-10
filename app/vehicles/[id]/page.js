"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VehicleDetail({ params }) {
  const [vehicles, setVehicles] = useState([]);
  const id = parseInt(params.id);
  const router = useRouter();

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

  function createCollage() {
    const selected = v.photos.slice(0, 4);

    sessionStorage.setItem("collageImages", JSON.stringify(selected));
    sessionStorage.setItem("collageText", `${v.year} ${v.make} ${v.model}`);

    router.push("/collage");
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
