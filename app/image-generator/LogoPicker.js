"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function LogoPicker({
  open,
  onClose,
  onSelect,
  selected = [],
  maxSelect = 3,
  canDelete = true,
}) {
  const [logos, setLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) loadLogos();
  }, [open]);

  async function loadLogos() {
    setError("");
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "logos"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setLogos(list);
    } catch (err) {
      setError("Failed to load logos.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(logo) {
    const isSelected = selected.find((l) => l.id === logo.id);
    if (isSelected) {
      onSelect(selected.filter((l) => l.id !== logo.id));
      return;
    }
    if (selected.length >= maxSelect) return;
    onSelect([...selected, logo]);
  }

  async function handleDelete(logoId) {
    if (!confirm("Delete this logo?")) return;
    try {
      await deleteDoc(doc(db, "logos", logoId));
      setLogos((prev) => prev.filter((l) => l.id !== logoId));
    } catch (err) {
      alert("Delete failed.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-xl w-[520px] max-h-[80vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-1">Select up to {maxSelect} logos</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click to select. Selected logos will be used on the image.
        </p>

        {error && (
          <div className="mb-3 text-red-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-600">Loading logos…</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {logos.map((logo) => {
              const isSelected = selected.find((l) => l.id === logo.id);
              return (
                <div
                  key={logo.id}
                  className={`relative border rounded p-2 cursor-pointer ${
                    isSelected ? "ring-2 ring-blue-600" : ""
                  }`}
                  onClick={() => toggleSelect(logo)}
                >
                  <img
                    src={logo.url}
                    alt="Logo"
                    className="w-full h-20 object-contain"
                  />

                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(logo.id);
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                      title="Delete logo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
