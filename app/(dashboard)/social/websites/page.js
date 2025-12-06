"use client";

import { useState, useEffect } from "react";

export default function WebsiteManagerPage() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState([]);
  const [message, setMessage] = useState("");

  async function loadWebsites() {
    const res = await fetch("/api/social/get-websites");
    const data = await res.json();
    setSaved(data.websites || []);
  }

  async function saveWebsite() {
    setMessage("Saving…");

    const res = await fetch("/api/social/save-website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    setMessage(data.message);

    setUrl("");
    loadWebsites();
  }

  useEffect(() => {
    loadWebsites();
  }, []);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">Website Manager</h1>

      <p className="text-gray-600 mb-4">
        Add dealership websites that the system will scrape images from.
      </p>

      <input
        type="text"
        placeholder="https://www.exampledealership.com"
        className="w-full p-3 border rounded mb-4"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={saveWebsite}
        className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
      >
        Save Website
      </button>

      {message && <p className="mt-4">{message}</p>}

      <div className="mt-6">
        <h2 className="font-semibold mb-2">Saved Websites</h2>

        {saved.length === 0 && <p className="text-gray-500">No websites saved yet.</p>}

        <ul className="space-y-2">
          {saved.map((site, i) => (
            <li
              key={i}
              className="p-3 bg-white border rounded shadow text-sm overflow-auto"
            >
              {site}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
