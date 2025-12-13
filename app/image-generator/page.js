"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [candidateImages, setCandidateImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [caption, setCaption] = useState("");
  const [resultImage, setResultImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // Pull images already loaded on the vehicle page
  // --------------------------------------------------
  function loadImagesFromPage() {
    const imgs = [...document.images]
      .map(i => i.currentSrc)
      .filter(src =>
        src &&
        src.includes("cdn.dlron.us") &&
        !src.includes("placeholder") &&
        !src.includes("missing")
      )
      .slice(0, 12);

    if (imgs.length === 0) {
      alert("No vehicle images found on this page.");
      return;
    }

    setCandidateImages(imgs);
    setSelectedImages([]);
    setResultImage(null);
  }

  // --------------------------------------------------
  // Generate image
  // --------------------------------------------------
  async function generateImage() {
    if (selectedImages.length !== 4) {
      alert("Select exactly 4 images.");
      return;
    }

    setLoading(true);
    setResultImage(null);

    try {
      // Convert selected images to base64
      const base64Images = await Promise.all(
        selectedImages.map(src =>
          fetch(src)
            .then(r => r.blob())
            .then(
              b =>
                new Promise(res => {
                  const fr = new FileReader();
                  fr.onload = () => res(fr.result);
                  fr.readAsDataURL(b);
                })
            )
        )
      );

      const res = await fetch("/api/buildImage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: base64Images,
          caption,
          logos: [],
        }),
      });

      const json = await res.json();

      if (json.error) {
        alert(json.error);
      } else {
        setResultImage(json.output);
      }
    } catch (err) {
      console.error(err);
      alert("Image build failed.");
    }

    setLoading(false);
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Vehicle Image Generator</h1>

      <button
        onClick={loadImagesFromPage}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Load Images From Vehicle Page
      </button>

      {candidateImages.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            Select exactly 4 images (top-left → top-right → bottom-left → bottom-right)
          </p>

          <div className="grid grid-cols-4 gap-3">
            {candidateImages.map((src, idx) => {
              const checked = selectedImages.includes(src);
              const disabled =
                !checked && selectedImages.length >= 4;

              return (
                <label
                  key={idx}
                  className={`border p-2 cursor-pointer ${
                    checked ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => {
                      if (checked) {
                        setSelectedImages(
                          selectedImages.filter(i => i !== src)
                        );
                      } else if (selectedImages.length < 4) {
                        setSelectedImages([...selectedImages, src]);
                      }
                    }}
                  />
                  <img
                    src={src}
                    className="h-24 w-full object-cover"
                  />
                </label>
              );
            })}
          </div>
        </>
      )}

      <div>
        <label className="font-semibold">Caption</label>
        <input
          className="w-full border p-2 rounded mt-1"
          maxLength={85}
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
      </div>

      <button
        onClick={generateImage}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded text-lg"
      >
        {loading ? "Generating…" : "Generate Image"}
      </button>

      {resultImage && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          <img
            src={resultImage}
            className="w-full rounded shadow"
          />
        </div>
      )}
    </div>
  );
}
