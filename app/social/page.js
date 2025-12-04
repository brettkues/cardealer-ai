"use client";

import { useState } from "react";

export default function SocialPage() {
  const [website, setWebsite] = useState("");
  const [inventoryImages, setInventoryImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [description, setDescription] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  async function scrapeSite() {
    setInventoryImages([]);
    setSelectedImages([]);
    setResultUrl(null);

    const res = await fetch("/api/scrape", {
      method: "POST",
      body: JSON.stringify({ url: website }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Unable to scrape website.");
      return;
    }

    // Placeholder: production scraper should return image URLs
    // For now we use dummy placeholders until scraper is rebuilt.
    setInventoryImages([
      "https://via.placeholder.com/800x800?text=Image+1",
      "https://via.placeholder.com/800x800?text=Image+2",
      "https://via.placeholder.com/800x800?text=Image+3",
      "https://via.placeholder.com/800x800?text=Image+4",
    ]);
  }

  function toggleSelect(img) {
    if (selectedImages.includes(img)) {
      setSelectedImages(selectedImages.filter((i) => i !== img));
    } else if (selectedImages.length < 4) {
      setSelectedImages([...selectedImages, img]);
    }
  }

  async function generateCollage() {
    if (selectedImages.length !== 4) {
      alert("Select exactly 4 images.");
      return;
    }

    setLoading(true);
    setResultUrl(null);

    const res = await fetch("/api/collage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: selectedImages,
        ribbonText: description,
      }),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setResultUrl(url);

    setLoading(false);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Facebook Image Generator</h1>

      <input
        type="text"
        placeholder="Dealer website URL"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ width: 400 }}
      />
      <button onClick={scrapeSite} style={{ marginLeft: 10 }}>
        Load Inventory
      </button>

      {inventoryImages.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Select 4 images:</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {inventoryImages.map((img) => (
              <img
                key={img}
                src={img}
                onClick={() => toggleSelect(img)}
                style={{
                  width: 150,
                  height: 150,
                  border: selectedImages.includes(img)
                    ? "4px solid blue"
                    : "2px solid gray",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          <textarea
            placeholder="Ribbon text / description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ marginTop: 20, width: 400, height: 80 }}
          />

          <button
            onClick={generateCollage}
            disabled={loading}
            style={{ marginTop: 10 }}
          >
            {loading ? "Generating..." : "Generate Collage"}
          </button>
        </>
      )}

      {resultUrl && (
        <div style={{ marginTop: 30 }}>
          <h3>Final Collage:</h3>
          <img src={resultUrl} style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
}
