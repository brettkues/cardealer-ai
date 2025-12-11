"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function WebsitesPage() {
  const router = useRouter();
  const [websites, setWebsites] = useState([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!auth.currentUser) router.push("/auth/login");
  }, []);

  useEffect(() => {
    const ref = collection(db, "websites");
    const unsub = onSnapshot(ref, (snap) => {
      setWebsites(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function addWebsite() {
    if (!name.trim() || !url.trim()) return;
    await addDoc(collection(db, "websites"), { name, url });
    setName("");
    setUrl("");
  }

  async function removeWebsite(id) {
    await deleteDoc(doc(db, "websites", id));
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">

      <h1 className="text-3xl font-bold mb-4">Website Manager</h1>

      <div className="flex flex-col gap-3 mb-6">
        <input
          className="p-3 border rounded"
          placeholder="Website Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="p-3 border rounded"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded"
          onClick={addWebsite}
        >
          Add Website
        </button>
      </div>

      <div className="space-y-4">
        {websites.map((site) => (
          <div
            key={site.id}
            className="p-4 border rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{site.name}</p>
              <a
                href={site.url}
                className="text-blue-600 underline"
                target="_blank"
              >
                {site.url}
              </a>
            </div>

            <button
              className="text-red-600 underline"
              onClick={() => removeWebsite(site.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
