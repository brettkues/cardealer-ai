"use client";

import { useState } from "react";

export default function GeneratorPage() {
  const [images, setImages] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [ribbonText, setRibbonText] = useState("");

  async function generateCollage() {
    setLoading(true);
    setResultUrl(null);

    const res = await fetch("/api/collage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images,
        ribbonText,
      }),
    });

    if (!res.ok) {
      alert("Failed to generate collage.");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setResultUrl(url);

    setLoading(false);
  }

  function handleImageChange(index, value) {
    const newArr = [...images];
    newArr[index] = value;
    setImages(newArr);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Image Collage Generator</h1>

      <p>Enter 4 image URLs:</p>

      {images.map((img, i) => (
        <input
          key={i}
          type="text"
          placeholder={`Image URL ${i + 1}`}
          value={img}
          onChange={(e) => handleImageChange(i, e.target.value)}
          style={{ display: "block", marginBottom: 10, width: "400px" }}
        />
      ))}

      <input
        type="text"
        placeholder="Ribbon text (optional)"
        value={ribbonText}
        onChange={(e) => setRibbonText(e.target.value)}
        style={{ marginTop: 10, width: "400px" }}
      />

      <button
        onClick={generateCollage}
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        {loading ? "Generating..." : "Generate Collage"}
      </button>

      {resultUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Generated Image:</h3>
          <img src={resultUrl} alt="Collage result" style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
}
