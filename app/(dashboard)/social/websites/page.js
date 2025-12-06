"use client";

import { useState, useEffect } from "react";

export default function WebsiteManagerPage() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [websites, setWebsites] = useState([]);

  const saveWebsite = async () => {
    if (!url.trim()) return;

    const res = await fetch("/api/social/save-website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    setMessage(data.message || "");
    setUrl("");
    loadWebsites();
  };

  const loadWebsites = async () => {
    const res = await fetch("/api/social/get-websites");
    const data = await res.json();
    setWebsites(data.websites || []);
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Website Manager</h1>

      <div className="space-y-4 max-w-lg">
        <input
          type="text"
          placeholder="Enter dealership website URL…"
          className="w-full p-3 border rounded"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={saveWebsite}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Save Website
        </button>

        {message && <p>{message}</p>}

        <h2 className="font-semibold mt-6">Saved Websites</h2>
        <ul className="list-disc ml-6">
          {websites.map((w, i) => (
            <li key={i}>{w.url}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
