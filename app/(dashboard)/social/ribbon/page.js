"use client";

import { useEffect, useState } from "react";

export default function RibbonPage() {
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState("");
  const [logos, setLogos] = useState([]);
  const [season, setSeason] = useState("auto");
  const [status, setStatus] = useState("");

  // Load selected images from previous screen
  useEffect(() => {
    const data = localStorage.getItem("selectedImages");
    if (data) setImages(JSON.parse(data));
  }, []);

  // Load logos saved by salesperson
  async function loadLogos() {
    const res = await fetch("/api/social/upload-logos", { method: "GET" });
    // Route returns nothing now because upload endpoint only handles POST
    // We will replace this once logo storage endpoint is built
  }

  useEffect(() => {
    loadLogos();
  }, []);

  async function createAICaption() {
    setStatus("Generating caption…");

    const prompt =
      "Write a short, upbeat 1–3 sentence caption for a dealership social media post.";

    const res = await fetch("/api/sales/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: prompt }),
    });

    const data = await res.json();

    setCaption(data.response || "");
    setStatus("");
  }

  function continueToFinal() {
    localStorage.setItem(
      "finalCollageData",
      JSON.stringify({
        images,
        caption,
        logos,
        season,
      })
    );

    window.location.href = "/dashboard/social/finalize";
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Ribbon & Caption</h1>

      {/* Caption Input */}
      <textarea
        className="w-full p-3 border rounded mb-4"
        rows={4}
        placeholder="Write your caption (1–3 sentences)…"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <button
        onClick={createAICaption}
        className="w-full bg-gray-700 text-white py-2 rounded hover:bg-black transition mb-6"
      >
        Generate Caption with AI
      </button>

      {/* Seasonal Ribbon Selector */}
      <label className="font-semibold">Ribbon Style</label>
      <select
        className="w-full p-3 border rounded mb-6"
        value={season}
        onChange={(e) => setSeason(e.target.value)}
      >
        <option value="auto">Auto (AI chooses seasonal ribbon)</option>
        <option value="spring">Spring</option>
        <option value="summer">Summer</option>
        <option value="fall">Fall</option>
        <option value="winter">Winter</option>
        <option value="holiday">Holiday</option>
      </select>

      {/* Continue Button */}
      <button
        onClick={continueToFinal}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
      >
        Continue to Final Image
      </button>

      {status && <p className="mt-4 text-gray-600">{status}</p>}
    </div>
  );
}
