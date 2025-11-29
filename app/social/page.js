"use client";

import { useState, useEffect } from "react";
import { auth, db, storage } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

export default function SocialGenerator() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dealer data
  const [dealer, setDealer] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState("");

  // Inputs
  const [vehicleUrl, setVehicleUrl] = useState("");
  const [description, setDescription] = useState("");
  const [seasonalRibbon, setSeasonalRibbon] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);

  // ========== AUTH ==========
  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        await loadDealerData(user.uid);
      }
      setLoading(false);
    });
  }, []);

  // ========== LOAD DEALER SETTINGS ==========
  async function loadDealerData(uid) {
    const dealerRef = doc(db, "users", uid, "settings", "dealer");
    const snap = await getDoc(dealerRef);

    if (snap.exists()) {
      const data = snap.data();
      setDealer(data);
      setWebsites(data.websites || []);
    }
  }

  // ========== SCRAPE IMAGES ==========
  async function scrapeImages() {
    const res = await fetch("/api/scrape", {
      method: "POST",
      body: JSON.stringify({ url: vehicleUrl }),
    });

    const data = await res.json();
    return data.images || [];
  }

  // ========== DETERMINE SEASON / HOLIDAY ==========
  function determineSeasonOrHoliday() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // Holiday detection (±10 days)
    const holidays = [
      { name: "christmas", month: 12, day: 25 },
      { name: "newyear", month: 1, day: 1 },
      { name: "4thofjuly", month: 7, day: 4 },
      { name: "thanksgiving", month: 11, day: 25 },
      { name: "memorial", month: 5, day: 27 },
      { name: "labor", month: 9, day: 2 },
    ];

    for (const h of holidays) {
      const holidayDate = new Date(now.getFullYear(), h.month - 1, h.day);
      const diff = Math.abs((now - holidayDate) / (1000 * 60 * 60 * 24));
      if (diff <= 10) return h.name;
    }

    // Seasonal fallback
    if (month === 12 || month <= 2) return "winter";
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    return "fall";
  }

  // ========== DETECT YMM FROM TITLE ==========
  function extractYMM(vehicleUrl) {
    const parts = vehicleUrl.split("-");
    const year = parts.find((x) => /^\d{4}$/.test(x)) || "";
    const make = parts[parts.indexOf(year) + 1] || "";
    const model = parts[parts.indexOf(year) + 2] || "";
    return `${year} ${make} ${model}`;
  }

  // ========== DISCLOSURE GENERATION ==========
  async function generateDisclosure(text) {
    const triggers = ["$", "price", "payment", "apr", "finance", "%", "down"];

    const needsDisclosure = triggers.some((t) =>
      text.toLowerCase().includes(t.toLowerCase())
    );

    if (!needsDisclosure) return "";

    // Load WI law PDF pointer
    const wiPdf = dealer?.laws?.wiAdvertising;

    let lawText = "";

    if (wiPdf) {
      const pdfUrl = wiPdf;
      const pdfText = await fetch(`/api/readpdf?url=${encodeURIComponent(pdfUrl)}`).then((r) =>
        r.text()
      );
      lawText = pdfText;
    } else {
      // Default WI law fallback
      lawText = `
        All offers plus tax, title, license & doc fee. 
        With approved credit. 
        See dealer for complete details.
      `;
    }

    return lawText.trim();
  }

  // ========== GENERATE FULL COLLAGE ==========
  async function generateImage() {
    const images = await scrapeImages();
    if (!images.length) return alert("Could not scrape images.");

    const season = determineSeasonOrHoliday();
    setSeasonalRibbon(season);

    const ymm = extractYMM(vehicleUrl);
    const disclosure = await generateDisclosure(description);

    const res = await fetch("/api/collage", {
      method: "POST",
      body: JSON.stringify({
        images: images.slice(0, 4),
        ribbon: season,
        logo: dealer.logoUrl,
        description,
        ymm,
        disclosure,
      }),
    });

    const blob = await res.blob();
    setGeneratedImage(URL.createObjectURL(blob));
  }

  if (loading) return <div className="p-10 text-xl">Loading…</div>;
  if (!uid) return <div className="p-10 text-xl">Please log in.</div>;
  if (!dealer) return <div className="p-10 text-xl">Loading dealer settings…</div>;

  return (
    <div className="p-10 max-w-3xl mx-auto text-xl">
      <h1 className="text-4xl font-bold mb-8">Social Media Generator</h1>

      {/* VEHICLE URL */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Vehicle URL</h2>
        <input
          className="border w-full p-3 rounded"
          placeholder="Paste ANY vehicle URL"
          value={vehicleUrl}
          onChange={(e) => setVehicleUrl(e.target.value)}
        />
      </div>

      {/* DESCRIPTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Description</h2>
        <textarea
          className="border w-full p-3 rounded h-32"
          placeholder="What do you want this post to say?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* WEBSITE DROPDOWN */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Select Website</h2>
        <select
          className="border p-3 rounded w-full"
          value={selectedWebsite}
          onChange={(e) => setSelectedWebsite(e.target.value)}
        >
          <option value="">Choose website…</option>
          {websites.map((site, i) => (
            <option key={i} value={site}>
              {site}
            </option>
          ))}
        </select>
      </div>

      {/* GENERATE BUTTON */}
      <button
        onClick={generateImage}
        className="bg-blue-600 text-white px-6 py-3 rounded text-xl"
      >
        Generate Image
      </button>

      {/* OUTPUT */}
      {generatedImage && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Generated Image</h2>
          <img src={generatedImage} className="w-full border" />

          <a
            href={generatedImage}
            download="social-image.png"
            className="block mt-4 bg-green-600 text-white px-4 py-2 rounded text-center"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}
