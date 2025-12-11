"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";

export default function ImageGenerator() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [manualURL, setManualURL] = useState("");
  const [identifier, setIdentifier] = useState(""); // Stock or VIN
  const [caption, setCaption] = useState("");
  const [logos, setLogos] = useState([]);
  const [selectedLogos, setSelectedLogos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);

  useEffect(() => {
    loadWebsites();
    loadLogos();
  }, []);

  async function loadWebsites() {
    const snap = await getDocs(collection(db, "websites"));
    const arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    setWebsites(arr);
  }

  async function loadLogos() {
    const snap = await getDocs(collection(db, "logos"));
    const arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    setLogos(arr);
  }

  function toggleLogo(id) {
    if (selectedLogos.includes(id)) {
      setSelectedLogos(selectedLogos.filter((x) => x !== id));
    } else {
      if (selectedLogos.length >= 3) return;
      setSelectedLogos([...selectedLogos, id]);
    }
  }

  async function handleGenerate() {
    setResultImage(null);
    setLoading(true);

    const siteToUse = manualURL.trim() || selectedWebsite;

    const res = await fetch("/api/lookupVehicle", {
      method: "POST",
      body: JSON.stringify({
        website: siteToUse,
        identifier,
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      setLoading(false);
      return;
    }

    const selectedLogoData = logos.filter((l) =>
      selectedLogos.includes(l.id)
    );

    const res2 = await fetch("/api/buildImage", {
      method: "POST",
      body: JSON.stringify({
        vehicle: data.vehicle,
        images: data.images,
        caption,
        logos: selectedLogoData,
      }),
    });

    const final = await res2.json();

    setResultImage(final.output);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      <h1 className="text-3xl font-bold">Image Generator</h1>

      {/* Website Selection */}
      <div className="space-y-2">
        <label className="font-semibold">Website</label>

        <select
          className="w-full p-3 border rounded"
          value={selectedWebsite}
          onChange={(e) => setSelectedWebsite(e.target.value)}
        >
          <option value="">Select Website</option>
          {websites.map((w) => (
            <option key={w.id} value={w.url}>
              {w.name} — {w.url}
            </option>
          ))}
        </select>

        <input
          className="w-full p-3 border rounded"
          placeholder="Or manually enter website URL"
          value={manualURL}
          onChange={(e) => setManualURL(e.target.value)}
        />
      </div>

      {/* Stock/VIN input */}
      <div className="space-y-2">
        <label className="font-semibold">
          Stock Number or Last 8 of VIN
        </label>
        <input
          className="w-full p-3 border rounded"
          placeholder="Example: L2925015 or R8556502"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <label className="font-semibold">Caption (85 characters max)</label>
        <input
          maxLength={85}
          className="w-full p-3 border rounded"
          placeholder="Enter your caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      {/* Logos */}
      <div className="space-y-2">
        <label className="font-semibold">Select up to 3 logos</label>

        <div className="grid grid-cols-3 gap-3">
          {logos.map((l) => (
            <div
              key={l.id}
              onClick={() => toggleLogo(l.id)}
              className={`border rounded p-2 cursor-pointer ${
                selectedLogos.includes(l.id)
                  ? "border-blue-600"
                  : "border-gray-300"
              }`}
            >
              <img
                src={l.url}
                alt="logo"
                className="w-full h-20 object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        className="w-full bg-blue-600 text-white p-4 rounded text-lg"
      >
        Generate Image
      </button>

      {loading && <p className="text-center">Generating…</p>}

      {resultImage && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <img src={resultImage} className="w-full rounded shadow" />
        </div>
      )}

    </div>
  );
}
