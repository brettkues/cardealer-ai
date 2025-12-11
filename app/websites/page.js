"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseClient";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function WebsitesManagerPage() {
  const router = useRouter();

  const [sites, setSites] = useState([]);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.currentUser) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const colRef = collection(db, "websites");

    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSites(list);
      },
      () => {
        setError("Failed to load websites.");
      }
    );

    return () => unsub();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    if (!newName.trim() || !newUrl.trim()) {
      setError("Name and URL required.");
      return;
    }

    try {
      await addDoc(collection(db, "websites"), {
        name: newName.trim(),
        url: newUrl.trim(),
      });

      setNewName("");
      setNewUrl("");
    } catch {
      setError("Failed to add website.");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDoc(doc(db, "websites", id));
    } catch {
      alert("Failed to delete.");
    }
  }

  async function handleLogout() {
    await auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <h2>Website Manager</h2>
      <button
        onClick={handleLogout}
        style={{ float: "right", marginTop: "-2.5rem" }}
      >
        Log Out
      </button>

      <div style={{ marginBottom: "1.5rem", clear: "both" }}>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="Website Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="url"
            placeholder="https://website.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            style={{ flex: 2 }}
          />
          <button type="submit">Add</button>
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      {sites.length === 0 ? (
        <p>No websites added.</p>
      ) : (
        <ul>
          {sites.map((site) => (
            <li key={site.id} style={{ marginBottom: "0.5rem" }}>
              <strong>{site.name}:</strong>{" "}
              <a href={site.url} target="_blank">
                {site.url}
              </a>
              <button
                onClick={() => handleDelete(site.id)}
                style={{ marginLeft: "1rem" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
