"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseClient";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function WebsitesPage() {
  const [websites, setWebsites] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    loadWebsites();
  }, []);

  async function loadWebsites() {
    const snap = await getDocs(collection(db, "websites"));
    const arr = [];
    snap.forEach((d) =>
      arr.push({ id: d.id, ...d.data() })
    );
    setWebsites(arr);
  }

  async function handleAdd() {
    if (!name || !url) return;

    await addDoc(collection(db, "websites"), {
      name,
      url
    });

    setName("");
    setUrl("");
    await loadWebsites();
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "websites", id));
    await loadWebsites();
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Websites</h1>

      {/* Add Website */}
      <div className="mb-6 space-y-3">
        <input
          className="w-full p-3 border rounded"
          placeholder="Website Name (e.g., Pischke Nissan)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded"
          placeholder="URL (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          onClick={handleAdd}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          Add Website
        </button>
      </div>

      {/* Website List */}
      <h2 className="text-xl font-semibold mb-3">Saved Websites</h2>

      <div className="space-y-3">
        {websites.map((w) => (
          <div
            key={w.id}
            className="border rounded p-3 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{w.name}</div>
              <div className="text-sm text-gray-600">{w.url}</div>
            </div>

            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => handleDelete(w.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
