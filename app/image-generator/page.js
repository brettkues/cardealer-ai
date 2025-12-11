"use client";

import { useState } from "react";
import { saveAs } from "file-saver";

export default function ImageGeneratorPage() {
  const [caption, setCaption] = useState("");
  const [vehicleUrl, setVehicleUrl] = useState("");
  const [site, setSite] = useState("");
  const [logos, setLogos] = useState([]);

  const [resultImg, setResultImg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    try {
      setLoading(true);
      setResultImg(null);

      // 1. SCRAPE DATA
      const scrapeRes = await fetch("/api/scrapeListing", {
        method: "POST",
        body: JSON.stringify({ url: vehicleUrl })
      }).then(r => r.json());

      const images = scrapeRes.images || [];
      const ymm = scrapeRes.ymm || "Vehicle";

      // 2. GET RIBBON DETAILS
      const ribbonRes = await fetch("/api/ribbon", {
        method: "POST",
        body: JSON.stringify({ caption, ymm })
      }).then(r => r.json());

      // 3. DISCLOSURE ENGINE
      const discRes = await fetch("/api/disclosure", {
        method: "POST",
        body: JSON.stringify({ caption })
      }).then(r => r.json());

      // Upload logo files to base64
      const logoFiles = await Promise.all(
        logos.map(file => fileToBase64(file))
      );

      // 4. BUILD FINAL IMAGE
      const finalRes = await fetch("/api/buildImage", {
        method: "POST",
        body: JSON.stringify({
          images,
          ribbonText: ribbonRes.shortRibbonText,
          disclosure: discRes.disclosure || "",
          logos: logoFiles,
          ymm
        })
      });

      const blob = await finalRes.blob();
      const url = URL.createObjectURL(blob);
      setResultImg(url);

    } catch (err) {
      console.error(err);
      alert("Failed to generate image.");
    } finally {
      setLoading(false);
    }
  }

  function fileToBase64(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Social Image Generator</h1>

      <div className="space-y-4">

        <input
          className="w-full p-3 border rounded"
          placeholder="Vehicle URL"
          value={vehicleUrl}
          onChange={e => setVehicleUrl(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded"
          placeholder="Caption (85 chars)"
          maxLength={85}
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />

        <div>
          <p className="font-semibold mb-2">Upload up to 3 logos:</p>
          <input type="file" accept="image/*" onChange={e => setLogos([e.target.files[0]])} />
          <input type="file" accept="image/*" onChange={e => setLogos(prev => [...prev, e.target.files[0]])} />
          <input type="file" accept="image/*" onChange={e => setLogos(prev => [...prev, e.target.files[0]])} />
        </div>

        <button
          onClick={handleGenerate}
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold"
        >
          {loading ? "Processing..." : "Generate Image"}
        </button>

        {resultImg && (
          <div className="mt-6 text-center">
            <img
              src={resultImg}
              className="border rounded shadow"
              width="425"
            />
            <button
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded"
              onClick={() => saveAs(resultImg, "facebook-image.jpg")}
            >
              Download Image
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
