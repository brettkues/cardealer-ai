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
  const [manualURL, setManualURL] = useState("");

  const [caption, setCaption] = useState("");
  const [logos, setLogos] = useState([]);
  const [selectedLogos, setSelectedLogos] = useState([]);

  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newWebsiteName, setNewWebsiteName] = useState("");
  const [newWebsiteURL, setNewWebsiteURL] = useState("");
  const [logoUploadFile, setLogoUploadFile] = useState(null);

  useEffect(() => {
    loadWebsites();
    loadLogos();
  }, []);

  async function loadWebsites() {
    const snap = await getDocs(collection(db, "websites"));
    setWebsites(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function loadLogos() {
    const snap = await getDocs(collection(db, "logos"));
    setLogos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

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

  async function uploadLogo() {
    if (!logoUploadFile) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      await addDoc(collection(db, "logos"), { url: e.target.result });
      setLogoUploadFile(null);
      loadLogos();
    };
    reader.readAsDataURL(logoUploadFile);
  }

  async function deleteLogo(id) {
    await deleteDoc(doc(db, "logos", id));
    setSelectedLogos(selectedLogos.filter(x => x !== id));
    loadLogos();
  }

  function toggleLogo(id) {
    if (selectedLogos.includes(id)) {
      setSelectedLogos(selectedLogos.filter(l => l !== id));
    } else {
      if (selectedLogos.length >= 3) return;
      setSelectedLogos([...selectedLogos, id]);
    }
  }

  // --------------------------
  // GENERATE IMAGE (FIXED)
  // --------------------------
  async function generateImage() {
    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const lookupRes = await fetch("/api/lookupVehicle", {
        method: "POST",
        body: JSON.stringify({ url: manualURL.trim() }),
      });

      const vehicleData = await lookupRes.json();
      if (!lookupRes.ok) throw new Error(vehicleData.error || "Lookup failed");

      const activeLogos = logos.filter(l => selectedLogos.includes(l.id));

      const buildRes = await fetch("/api/buildImage", {
        method: "POST",
        body: JSON.stringify({
          images: vehicleData.images,
          caption,
          logos: activeLogos,
        }),
      });

      const result = await buildRes.json();
      if (!buildRes.ok) throw new Error(result.error || "Build failed");

      // ✅ THIS IS THE FIX
      setResultImage(result.images?.[0] || null);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={generateImage}
        className="w-full bg-blue-600 text-white p-4 rounded text-lg"
      >
        Generate Image
      </button>

      {loading && <p className="text-center mt-4">Generating…</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {resultImage && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <img src={resultImage} className="w-full rounded shadow" />
        </div>
      )}
    </div>
  );
}
