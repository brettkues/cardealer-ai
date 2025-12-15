"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/firebaseClient";
import { ref, listAll, getDownloadURL } from "firebase/storage";

export default function LogoPicker({ open, onClose, onSelect, selected }) {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    if (open) loadLogos();
  }, [open]);

  async function loadLogos() {
    const folderRef = ref(storage, "logos/");
    const all = await listAll(folderRef);

    const items = await Promise.all(
      all.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return { id: item.name, url };
      })
    );

    setLogos(items);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-xl w-[520px] max-h-[80vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Select a Logo</h2>

        <div className="grid grid-cols-3 gap-4">
          {logos.map((logo) => (
            <div
              key={logo.id}
              onClick={() => onSelect(logo)}
              className={`border rounded p-2 cursor-pointer ${
                selected?.id === logo.id
                  ? "ring-2 ring-blue-600"
                  : ""
              }`}
            >
              <img
                src={logo.url}
                alt="Logo"
                className="w-full h-20 object-contain"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
