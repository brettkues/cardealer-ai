"use client";

import { useState } from "react";

export default function LogoManagerPage() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploaded, setUploaded] = useState([]);

  const uploadLogos = async () => {
    if (!files.length) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append("logos", file);
    }

    const res = await fetch("/api/social/upload-logos", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || "");
    setUploaded(data.urls || []);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Logo Manager</h1>

      <div className="space-y-4 max-w-lg">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles([...e.target.files])}
        />

        <button
          onClick={uploadLogos}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Upload Logos
        </button>

        {message && <p>{message}</p>}

        {uploaded.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {uploaded.map((url, i) => (
              <img
                key={i}
                src={url}
                className="border rounded shadow"
                alt="Uploaded Logo"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
