"use client";

import { useEffect, useState } from "react";

export default function WebsiteManager() {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [websites, setWebsites] = useState([]);

  async function loadWebsites() {
    const res = await fetch("/api/websites");
    const data = await res.json();
    setWebsites(data.websites || []);
  }

  async function addWebsite() {
    if (!url || !label) return;

    await fetch("/api/websites", {
      method: "POST",
      body: JSON.stringify({ url, label }),
    });

    setUrl("");
    setLabel("");
    loadWebsites();
  }

  async function deleteWebsite(id) {
    await fetch("/api/websites", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    loadWebsites();
  }

  useEffect(() => {
    loadWebsites();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Website Manager</h1>

      <input
        type="text"
        placeholder="Website Label"
        className="w-full p-3 border rounded mb-3"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <input
        type="text"
        placeholder="Website URL"
        className="w-full p-3 border rounded mb-3"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={addWebsite}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6"
      >
        Add Website
      </button>

      <h2 className="text-xl font-semibold mb-3">Saved Websites</h2>

      <div className="space-y-3">
        {websites.map((site) => (
          <div
            key={site.id}
            className="flex justify-between items-center bg-gray-100 p-3 rounded"
          >
            <div>
              <div className="font-bold">{site.label}</div>
              <div className="text-sm text-gray-600">{site.url}</div>
            </div>

            <button
              onClick={() => deleteWebsite(site.id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
