"use client";

import { useState, useEffect } from "react";

export default function LogoManagerPage() {
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [message, setMessage] = useState("");

  const uploadLogos = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append("logos", file);
    }

    setMessage("Uploading…");

    const res = await fetch("/api/social/upload-logos", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || "");

    if (data.urls) {
      setUrls((prev) => [...prev, ...data.urls]);
    }
  };

  // Load logos from Firestore bucket (if we add listing API later)
  useEffect(() => {
    // Placeholder — currently only loads newly uploaded ones
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Logo Manager</h1>

      {/* Upload Section */}
      <div className="space-y-4 max-w-xl mb-6">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />

        <button
          onClick={uploadLogos}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Upload Logos
        </button>

        <p>{message}</p>
      </div>

      {/* Display Uploaded Logos */}
      <div className="grid grid-cols-4 gap-4">
        {urls.map((url, i) => (
          <img
            key={i}
            src={url}
            className="border rounded w-full h-32 object-contain bg-white p-2 shadow"
          />
        ))}
      </div>
    </div>
  );
}
