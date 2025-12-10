"use client";

import { useState } from "react";

export default function CollagePage() {
  const [files, setFiles] = useState([]);
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);

  async function generate() {
    const imgs = await Promise.all(
      [...files].map(
        (f) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(f);
          })
      )
    );

    const res = await fetch("/api/collage", {
      method: "POST",
      body: JSON.stringify({
        images: imgs,
        ribbonText: text,
      }),
    });

    const data = await res.json();
    setResult(data.image);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Collage Generator</h1>

      <input
        type="file"
        accept="image/*"
        multiple
        className="mb-4"
        onChange={(e) => setFiles(e.target.files)}
      />

      <input
        type="text"
        placeholder="Ribbon text..."
        className="block w-full p-3 border rounded mb-4"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={generate}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Generate
      </button>

      {result && (
        <div className="mt-6">
          <img src={result} className="border shadow rounded" />

          <a
            href={result}
            download="collage.png"
            className="block mt-4 px-4 py-2 bg-green-600 text-white rounded text-center"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}
