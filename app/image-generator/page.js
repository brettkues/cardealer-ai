"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseClient";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

export default function ImageGenerator() {
  const [tab, setTab] = useState("generate");

  const [vehicleURL, setVehicleURL] = useState("");
  const [caption, setCaption] = useState("");

  const [logos, setLogos] = useState([]);
  const [selectedLogos, setSelectedLogos] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);

  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogos();
  }, []);

  async function loadLogos() {
    const snap = await getDocs(collection(db, "logos"));
    const arr = [];
    snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
    setLogos(arr);
  }

  function toggleLogo(id) {
    if (selectedLogos.includes(id)) {
      setSelectedLogos(selectedLogos.filter((l) => l !== id));
    } else {
      if (selectedLogos.length >= 3) return;
      setSelectedLogos([...selectedLogos, id]);
    }
  }

  async function uploadLogo() {
    if (!uploadFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;

      await addDoc(collection(db, "logos"), {
        url: base64,
      });

      setUploadFile(null);
      loadLogos();
    };

    reader.readAsDataURL(uploadFile);
  }

  async function deleteLogo(id) {
    await deleteDoc(doc(db, "logos", id));
    setSelectedLogos(selectedLogos.filter((x) => x !== id));
    loadLogos();
  }

  async function generateImage() {
    setLoading(true);
    setResultImage(null);

    if (!vehicleURL.trim()) {
      alert("Please paste a vehicle URL first.");
      setLoading(false);
      return;
    }

    const lookup = await fetch("/api/lookupVehicle", {
      method: "POST",
      body: JSON.stringify({ url: vehicleURL }),
    });

    const vehicleData = await lookup.json();

    if (vehicleData.error) {
      alert(vehicleData.error);
      setLoading(false);
      return;
    }

    const activeLogos = logos.filter((l) => selectedLogos.includes(l.id));

    const build = await fetch("/api/buildImage", {
      method: "POST",
      body: JSON.stringify({
        vehicle: vehicleData.vehicle,
        images: vehicleData.images,
        caption,
        logos: activeLogos,
      }),
    });

    const result = await build.json();
    setResultImage(result.output);

    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">

      {/* TABS */}
      <div className="flex gap-6 mb-6 border-b pb-2 text-lg font-medium">
        <button
          onClick={() => setTab("generate")}
          className={tab === "generate" ? "border-b-2 border-blue-600 pb-2" : ""}
        >
          Generate Image
        </button>

        <button
          onClick={() => setTab("logos")}
          className={tab === "logos" ? "border-b-2 border-blue-600 pb-2" : ""}
        >
          Upload Logos
        </button>
      </div>

      {/* ---------------- GENERATE TAB ---------------- */}
      {tab === "generate" && (
        <div className="space-y-6">

          {/* VEHICLE URL */}
          <div>
            <label className="font-semibold">Paste Vehicle URL</label>
            <input
              className="w-full p-3 border rounded mt-1"
              placeholder="https://www.exampledealer.com/used-vehicle-1234"
              value={vehicleURL}
              onChange={(e) => setVehicleURL(e.target.value)}
            />
          </div>

          {/* CAPTION */}
          <div>
            <label className="font-semibold">
              Caption (85 characters max)
            </label>
            <input
              maxLength={85}
              className="w-full p-3 border rounded mt-1"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {/* LOGO PICKER */}
          <div>
            <label className="font-semibold">Select up to 3 logos</label>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {logos.length === 0 && (
                <div className="col-span-3 text-center text-gray-600 text-sm">
                  No logos uploaded yet. Add some under “Upload Logos”.
                </div>
              )}

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
                  <img src={l.url} className="w-full h-20 object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <button
            onClick={generateImage}
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
      )}

      {/* ---------------- UPLOAD LOGOS TAB ---------------- */}
      {tab === "logos" && (
        <div className="space-y-6">

          <div>
            <label className="font-semibold">Upload Logos</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />

            <button
              onClick={uploadLogo}
              className="w-full bg-green-600 text-white p-3 rounded mt-3"
            >
              Upload Logo
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            {logos.map((l) => (
              <div key={l.id} className="border p-2 rounded relative">
                <img src={l.url} className="w-full h-20 object-contain" />

                <button
                  onClick={() => deleteLogo(l.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded px-2 py-0.5 text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
