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

  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState("");
  const [manualURL, setManualURL] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [caption, setCaption] = useState("");
  const [logos, setLogos] = useState([]);
  const [selectedLogos, setSelectedLogos] = useState([]);
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [newWebsiteURL, setNewWebsiteURL] = useState("");

  const [logoUploadFile, setLogoUploadFile] = useState(null);

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

  // --------------------------
  // WEBSITE MANAGEMENT
  // --------------------------

  async function addWebsite() {
    if (!newWebsiteName || !newWebsiteURL) return;

    await addDoc(collection(db, "websites"), {
      name: newWebsiteName,
      url: newWebsiteURL,
    });

    setNewWebsiteName("");
    setNewWebsiteURL("");
    loadWebsites();
  }

  async function removeWebsite(id) {
    await deleteDoc(doc(db, "websites", id));
    loadWebsites();
  }

  // --------------------------
  // LOGO MANAGEMENT
  // --------------------------

  async function uploadLogo() {
    if (!logoUploadFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;

      await addDoc(collection(db, "logos"), {
        url: base64,
      });

      setLogoUploadFile(null);
      loadLogos();
    };

    reader.readAsDataURL(logoUploadFile);
  }

  async function deleteLogo(id) {
    await deleteDoc(doc(db, "logos", id));
    setSelectedLogos(selectedLogos.filter((x) => x !== id));
    loadLogos();
  }

  function toggleLogo(id) {
    if (selectedLogos.includes(id)) {
      setSelectedLogos(selectedLogos.filter((l) => l !== id));
    } else {
      if (selectedLogos.length >= 3) return;
      setSelectedLogos([...selectedLogos, id]);
    }
  }

  // --------------------------
  // IMAGE GENERATION
  // --------------------------

  async function generateImage() {
    setLoading(true);
    setResultImage(null);

    const siteToUse = manualURL.trim() || selectedWebsite;

    const lookup = await fetch("/api/lookupVehicle", {
      method: "POST",
      body: JSON.stringify({
        website: siteToUse,
        identifier,
      }),
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

  // --------------------------
  // RENDER PAGE
  // --------------------------

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
          onClick={() => setTab("websites")}
          className={tab === "websites" ? "border-b-2 border-blue-600 pb-2" : ""}
        >
          Websites
        </button>

        <button
          onClick={() => setTab("logos")}
          className={tab === "logos" ? "border-b-2 border-blue-600 pb-2" : ""}
        >
          Logo Vault
        </button>
      </div>

      {/* ---------------- GENERATE TAB ---------------- */}
      {tab === "generate" && (
        <div className="space-y-6">

          {/* WEBSITE SELECT */}
          <div>
            <label className="font-semibold">Website</label>
            <select
              className="w-full p-3 border rounded mt-1"
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
            >
              <option value="">Select website</option>
              {websites.map((w) => (
                <option key={w.id} value={w.url}>
                  {w.name} — {w.url}
                </option>
              ))}
            </select>

            <input
              className="w-full p-3 border rounded mt-2"
              placeholder="Or manually enter website URL"
              value={manualURL}
              onChange={(e) => setManualURL(e.target.value)}
            />
          </div>

          {/* IDENTIFIER */}
          <div>
            <label className="font-semibold">
              Stock Number or Last 8 of VIN
            </label>
            <input
              className="w-full p-3 border rounded mt-1"
              placeholder="Example: L2925015 or R8556502"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          {/* CAPTION */}
          <div>
            <label className="font-semibold">Caption (85 characters max)</label>
            <input
              maxLength={85}
              className="w-full p-3 border rounded mt-1"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {/* LOGO SELECTION */}
          <div>
            <label className="font-semibold flex justify-between">
              <span>Select up to 3 logos</span>
              <button
                onClick={() => setTab("logos")}
                className="text-blue-600 underline text-sm"
              >
                Manage Logos
              </button>
            </label>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {logos.length === 0 && (
                <div className="col-span-3 text-center text-gray-600 text-sm">
                  No logos uploaded yet. Click “Manage Logos” to add some.
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
                  <img
                    src={l.url}
                    className="w-full h-20 object-contain"
                  />
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

      {/* ---------------- WEBSITES TAB ---------------- */}
      {tab === "websites" && (
        <div className="space-y-6">

          <div>
            <label className="font-semibold">Website Name</label>
            <input
              className="w-full p-3 border rounded mt-1"
              value={newWebsiteName}
              onChange={(e) => setNewWebsiteName(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Website URL</label>
            <input
              className="w-full p-3 border rounded mt-1"
              value={newWebsiteURL}
              onChange={(e) => setNewWebsiteURL(e.target.value)}
            />
          </div>

          <button
            onClick={addWebsite}
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            Add Website
          </button>

          <div className="mt-6 space-y-3">
            {websites.map((w) => (
              <div
                key={w.id}
                className="border p-3 rounded flex justify-between"
              >
                <div>
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-sm text-gray-600">{w.url}</div>
                </div>

                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => removeWebsite(w.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- LOGO VAULT TAB ---------------- */}
      {tab === "logos" && (
        <div className="space-y-6">

          <div>
            <label className="font-semibold">Upload Logo</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={(e) => setLogoUploadFile(e.target.files[0])}
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
