"use client";

import { useState } from "react";

export default function LogoManagerPage() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const uploadLogos = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("logos", file));

    const res = await fetch("/api/social/upload-logos", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || "Upload complete.");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Logo Manager</h1>

      <div className="space-y-4 max-w-md">
        <input
          type="file"
          multiple
          accept="image/*"
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
    </div>
  );
}
