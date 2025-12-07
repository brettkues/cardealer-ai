"use client";

import { useState } from "react";

export default function FITrainingUploadPage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  const uploadTraining = async () => {
    const formData = new FormData();

    if (file) formData.append("file", file);
    if (text.trim()) formData.append("text", text);

    const res = await fetch("/api/fi/train", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || "Uploaded.");
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">F&amp;I Training Upload</h1>

      <div className="space-y-4 max-w-lg">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <textarea
          className="w-full p-3 border rounded"
          rows={4}
          placeholder="Or paste F&I training text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={uploadTraining}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Upload Training
        </button>

        <p>{message}</p>
      </div>
    </div>
  );
}
