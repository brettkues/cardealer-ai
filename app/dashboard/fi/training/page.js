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
