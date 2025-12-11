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

export default function LogosPage() {
  const router = useRouter();
  const [logos, setLogos] = useState([]);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!auth.currentUser) router.push("/auth/login");
  }, []);

  useEffect(() => {
    const ref = collection(db, "logos");
    const unsub = onSnapshot(ref, (snap) => {
      setLogos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function addLogo() {
    if (!url.trim()) return;
    await addDoc(collection(db, "logos"), { url });
    setUrl("");
  }

  async function removeLogo(id) {
    await deleteDoc(doc(db, "logos", id));
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow p-6 rounded">
      <h1 className="text-3xl font-bold mb-4">Logo Manager</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 p-3 border"
          placeholder="Logo URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={addLogo}
        >
          Add
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {logos.map((l) => (
          <div
            key={l.id}
            className="p-3 border rounded flex flex-col items-center"
          >
            <img
              src={l.url}
              className="max-h-20 mb-2"
              alt="logo"
            />
            <button
              className="text-red-600 underline"
              onClick={() => removeLogo(l.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
