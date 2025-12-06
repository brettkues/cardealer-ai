"use client";

import { useEffect, useState } from "react";

export default function ImageGeneratorPage() {
  const [selected, setSelected] = useState([]);
  const [ribbonText, setRibbonText] = useState("");
  const [output, setOutput] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("selectedImages");
    if (stored) setSelected(JSON.parse(stored));
  }, []);

  const generateCollage = async () => {
    if (selected.length !== 4) return;

    setMessage("Generating collage…");

    const res = await fetch("/api/collage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrls: selected, ribbonText }),
    });

    if (res.headers.get("Content-Type") === "image/jpeg") {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setOutput(url);
    }

    setMessage("");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Image Generator</h1>

      {/* Ribbon Text */}
      <div className="max-w-xl space-y-4 mb-6">
        <textarea
          placeholder="Optional ribbon text…"
          className="w-full p-3 border rounded"
          value={ribbonText}
          onChange={(e) => setRibbonText(e.target.value)}
        />

        <button
          onClick={generateCollage}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Generate Image
        </button>

        {message && <p>{message}</p>}
      </div>

      {/* Preview of Selected Images */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {selected.map((src, i) => (
          <img
            key={i}
            src={src}
            className="w-full h-32 object-cover border rounded"
          />
        ))}
      </div>

      {/* Final Output */}
      {output && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Final Image:</h2>
          <img src={output} className="w-[850px] border rounded shadow" />

          <a
            href={output}
            download="collage.jpg"
            className="inline-block mt-4 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Download Image
          </a>
        </div>
      )}
    </div>
  );
}
