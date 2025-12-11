"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";

export default function WebsitesPage() {
  const [url, setUrl] = useState("");
  const [websites, setWebsites] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);

      if (u) {
        const ref = collection(db, "users", u.uid, "websites");
        return onSnapshot(ref, (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setWebsites(list);
        });
      }
    });

    return () => unsub();
  }, []);

  async function handleAdd() {
    if (!user || !url.trim()) return;

    await addDoc(collection(db, "users", user.uid, "websites"), {
      url,
      createdAt: Date.now(),
    });

    setUrl("");
  }

  async function handleDelete(id) {
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "websites", id));
  }

  if (!user) {
    return (
      <div className="p-10 text-center text-xl">
        Please <a href="/login" className="underline text-blue-600">log in</a>.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-semibold mb-4">Website Manager</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 p-3 border rounded"
          placeholder="Enter dealership website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          Add
        </button>
      </div>

      <ul className="space-y-3">
        {websites.map((site) => (
          <li
            key={site.id}
            className="flex justify-between items-center p-3 border rounded"
          >
            <span>{site.url}</span>
            <button
              onClick={() => handleDelete(site.id)}
              className="text-red-600 underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
