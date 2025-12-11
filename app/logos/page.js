"use client";

import { useEffect, useState } from "react";

export default function LogoManager() {
  const [logos, setLogos] = useState([]);
  const [file, setFile] = useState(null);

  async function loadLogos() {
    const res = await fetch("/api/logos");
    const data = await res.json();
    setLogos(data.logos || []);
  }

  async function uploadLogo() {
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    await fetch("/api/logos", {
      method: "POST",
      body: form,
    });

    setFile(null);
    loadLogos();
  }

  async function deleteLogo(id) {
    await fetch("/api/logos", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });

    loadLogos();
  }

  useEffect(() => {
    loadLogos();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Logo Manager</h1>

      <input type="file" className="mb-4" onChange={(e) => setFile(e.target.files[0])} />

      <button
        onClick={uploadLogo}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6"
      >
        Upload Logo
      </button>

      <h2 className="text-xl font-semibold mb-3">Saved Logos</h2>

      <div className="grid grid-cols-2 gap-4">
        {logos.map((logo) => (
          <div key={logo.id} className="bg-gray-100 p-3 rounded shadow">
            <img src={logo.url} className="w-full h-32 object-contain" />
            <button
              onClick={() => deleteLogo(logo.id)}
              className="w-full mt-2 bg-red-600 text-white p-2 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
