"use client";

import { useState, useEffect } from "react";

export default function WebsiteManagerPage() {
  const [url, setUrl] = useState("");
  const [websites, setWebsites] = useState([]);
  const [message, setMessage] = useState("");

  // Load all websites from Firestore
  const loadWebsites = async () => {
    const res = await fetch("/api/social/get-websites");
    const data = await res.json();

    // website objects must include { id, url }
    setWebsites(data.websites || []);
  };

  // Save new website
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

  // Delete website
  const deleteWebsite = async (id) => {
    const res = await fetch("/api/social/delete-website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    await res.json();
    loadWebsites();
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Website Manager</h1>

      {/* Add Website */}
      <div className="space-y-4 max-w-xl mb-6">
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="Enter dealership website URL…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={saveWebsite}
          className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        >
          Save Website
        </button>

        <p>{message}</p>
      </div>

      {/* Website List */}
      <div className="space-y-2">
        {websites.map((site) => (
          <div
            key={site.id}
            className="p-3 bg-white border rounded shadow flex justify-between items-center"
          >
            <span>{site.url}</span>

            <button
              onClick={() => deleteWebsite(site.id)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
