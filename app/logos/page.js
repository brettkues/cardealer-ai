"use client";

import { useEffect, useState } from "react";

export default function LogoManager() {
  const [logos, setLogos] = useState([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch("/api/logos");
    const data = await res.json();
    setLogos(data.logos || []);
  }

  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const form = new FormData();
    form.append("file", file);

    await fetch("/api/logos", {
      method: "POST",
      body: form,
    });

    await load();
    setUploading(false);
  }

  async function remove(id) {
    await fetch("/api/logos", {
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
      <h1 className="text-3xl font-bold mb-6">Logo Manager</h1>

      <input type="file" onChange={upload} disabled={uploading} className="mb-6" />

      <div className="grid grid-cols-3 gap-4">
        {logos.map((l) => (
          <div key={l.id} className="bg-gray-50 p-3 border rounded shadow">
            <img src={l.url} className="w-full h-32 object-contain rounded" />
            <button
              onClick={() => remove(l.id)}
              className="mt-2 bg-red-600 text-white w-full p-2 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
