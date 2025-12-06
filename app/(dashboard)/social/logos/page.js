"use client";

import { useState } from "react";

export default function LogoManagerPage() {
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [message, setMessage] = useState("");

  async function uploadLogos() {
    setMessage("Uploading...");
    const formData = new FormData();

    files.forEach((file) => formData.append("logos", file));

    const res = await fetch("/api/social/upload-logos", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setMessage(data.message || "");
    setUrls(data.urls || []);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Logo Manager</h1>

      <p className="mb-4 text-gray-600">
        Upload up to 3 logos (Dealer logo, OEM logo, event logo).
      </p>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => setFiles(Array.from(e.target.files))}
        className="w-full p-3 border rounded mb-4"
      />

      <button
        onClick={uploadLogos}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
      >
        Upload Logos
      </button>

      {message && <p className="mt-4">{message}</p>}

      {urls.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Uploaded Logos</h2>
          <div className="grid grid-cols-3 gap-4">
            {urls.map((url, i) => (
              <img key={i} src={url} className="border rounded p-2 bg-white" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
