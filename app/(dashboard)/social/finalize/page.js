"use client";

import { useEffect, useState } from "react";

export default function FinalizePage() {
  const [data, setData] = useState(null);
  const [finalUrl, setFinalUrl] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("finalCollageData");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  async function generateFinalImage() {
    if (!data) return;

    setStatus("Generating final image…");

    const res = await fetch("/api/social/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const out = await res.json();

    setFinalUrl(out.url || null);
    setStatus("");
  }

  if (!data) {
    return <p>Loading…</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Finalize Image</h1>

      {/* Selected Images Preview */}
      <h2 className="font-semibold mb-2">Selected Images</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {data.images.map((url, i) => (
          <img
            key={i}
            src={url}
            className="w-full h-40 object-cover border rounded"
          />
        ))}
      </div>

      {/* Caption */}
      <h2 className="font-semibold mb-2">Caption</h2>
      <div className="p-3 border rounded bg-white mb-6">{data.caption || "No caption"}</div>

      {/* Ribbon Style */}
      <h2 className="font-semibold mb-2">Ribbon Style</h2>
      <div className="p-3 border rounded bg-white mb-6 capitalize">
        {data.season === "auto" ? "Automatic (AI chooses)" : data.season}
      </div>

      {/* Generate button */}
      <button
        onClick={generateFinalImage}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition mb-6"
      >
        Generate Final Image
      </button>

      {status && <p className="text-gray-700 mb-4">{status}</p>}

      {/* Result */}
      {finalUrl && (
        <div className="mt-6 text-center">
          <h2 className="font-semibold mb-4">Final Image Ready</h2>
          <img src={finalUrl} className="w-80 h-80 object-cover border rounded mx-auto mb-4" />
          <a
            href={finalUrl}
            download="social-image.jpg"
            className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition inline-block"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}
