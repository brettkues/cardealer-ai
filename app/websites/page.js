"use client";

import { useEffect, useState } from "react";

export default function WebsitesPage() {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [websites, setWebsites] = useState([]);

  async function load() {
    const res = await fetch("/api/websites");
    const data = await res.json();
    setWebsites(data.websites || []);
  }

  async function add() {
    if (!label.trim() || !url.trim()) return;

    await fetch("/api/websites", {
      method: "POST",
      body: JSON.stringify({ label, url }),
    });

    setLabel("");
    setUrl("");

    await load();
  }

  async function remove(id) {
    await fetch("/api/websites", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-6">Website Manager</h1>

      <input
        className="w-full p-3 border rounded mb-3"
        placeholder="Label (e.g., Pischke Nissan)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <input
        className="w-full p-3 border rounded mb-3"
        placeholder="Website URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={add}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6"
      >
        Add Website
      </button>

      <div className="space-y-3">
        {websites.map((w) => (
          <div
            key={w.id}
            className="p-3 border rounded bg-gray-50 flex justify-between items-center"
          >
            <div>
              <div className="font-bold">{w.label}</div>
              <div className="text-sm text-gray-600">{w.url}</div>
            </div>

            <button
              onClick={() => remove(w.id)}
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
