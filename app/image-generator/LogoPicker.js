"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";

export default function LogoPicker({ open, onClose, onSelect, selected }) {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    if (open) loadLogos();
  }, [open]);

  async function loadLogos() {
    const snap = await getDocs(collection(db, "logos"));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setLogos(list);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-xl w-[500px] max-h-[80vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Select up to 3 Logos</h2>

        <div className="grid grid-cols-3 gap-4">
          {logos.map((logo) => {
            const active = selected.includes(logo.url);
            return (
              <div
                key={logo.id}
                onClick={() => onSelect(logo.url)}
                className={`border rounded p-2 cursor-pointer ${
                  active ? "ring-4 ring-blue-500" : ""
                }`}
              >
                <img src={logo.url} className="w-full h-auto" />
              </div>
            );
          })}
        </div>

        <button
          className="mt-6 w-full bg-gray-800 text-white p-3 rounded"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}
