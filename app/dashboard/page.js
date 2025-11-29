"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dealer data fields
  const [logoUrl, setLogoUrl] = useState("");
  const [dealerDescription, setDealerDescription] = useState("");
  const [websites, setWebsites] = useState([]);
  const [trainingDocs, setTrainingDocs] = useState([]);
  const [aiNotes, setAiNotes] = useState("");
  const [address, setAddress] = useState("");

  // temp website input
  const [newWebsite, setNewWebsite] = useState("");

  // ========== AUTH WATCHER ==========
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        await loadDealerData(user.uid);
      }
      setLoading(false);
    });
  }, []);

  // ========== LOAD DATA FROM FIRESTORE ==========
  async function loadDealerData(uid) {
    const dealerRef = doc(db, "users", uid, "settings", "dealer");
    const snap = await getDoc(dealerRef);

    if (snap.exists()) {
      const data = snap.data();
      setLogoUrl(data.logoUrl || "");
      setDealerDescription(data.dealerDescription || "");
      setWebsites(data.websites || []);
      setTrainingDocs(data.trainingDocs || []);
      setAiNotes(data.aiNotes || "");
      setAddress(data.address || "");
    }
  }

  // ========== SAVE DATA TO FIRESTORE ==========
  async function saveDealerData() {
    if (!uid) return;

    const dealerRef = doc(db, "users", uid, "settings", "dealer");

    await setDoc(
      dealerRef,
      {
        logoUrl,
        dealerDescription,
        websites,
        trainingDocs,
        aiNotes,
        address,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    alert("Dealer settings saved!");
  }

  // ========== LOGO UPLOAD ==========
  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file || !uid) return;

    const storageRef = ref(storage, `dealer/${uid}/logo.png`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setLogoUrl(url);
  }

  // ========== TRAINING DOC UPLOAD ==========
  async function handleTrainingUpload(e) {
    const file = e.target.files[0];
    if (!file || !uid) return;

    const storageRef = ref(
      storage,
      `dealer/${uid}/training/${file.name}`
    );

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    setTrainingDocs((prev) => [...prev, url]);
  }

  // ========== WEBSITE MANAGEMENT ==========
  function addWebsite() {
    if (!newWebsite.trim()) return;
    setWebsites((prev) => [...prev, newWebsite.trim()]);
    setNewWebsite("");
  }

  function removeWebsite(i) {
    setWebsites((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (loading) return <div className="p-10 text-xl">Loading…</div>;
  if (!uid) return <div className="p-10 text-xl">Please log in.</div>;

  return (
    <div className="p-10 max-w-3xl mx-auto text-xl">
      <h1 className="text-4xl font-bold mb-8">Dealer Knowledge Center</h1>

      {/* ========== LOGO UPLOAD SECTION ========== */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Dealer Logo</h2>

        {logoUrl && (
          <img
            src={logoUrl}
            alt="Dealer Logo"
            className="w-48 mb-4 border"
          />
        )}

        <input type="file" accept="image/*" onChange={handleLogoUpload} />
      </section>

      {/* ========== DEALER DESCRIPTION ========== */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Dealer Description</h2>
        <textarea
          value={dealerDescription}
          onChange={(e) => setDealerDescription(e.target.value)}
          className="border w-full p-3 rounded h-32"
        />
      </section>

      {/* ========== ADDRESS ========== */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Physical Address</h2>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border w-full p-3 rounded"
          placeholder="123 Main St, La Crosse, WI"
        />
      </section>

      {/* ========== WEBSITES ========== */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">Websites</h2>

        {websites.map((site, i) => (
          <div key={i} className="flex items-center mb-2">
            <div className="flex-1">{site}</div>
            <button
              onClick={() => removeWebsite(i)}
              className="text-red-600"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="flex gap-2 mt-4">
          <input
            value={newWebsite}
            onChange={(e) => setNewWebsite(e.target.value)}
            className="border p-3 rounded flex-1"
            placeholder="https://www.example.com"
          />
          <button
            onClick={addWebsite}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </section>

      {/* ========== TRAINING DOCS ========== */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">
          Training PDFs / Documents
        </h2>

        {trainingDocs.length > 0 &&
          trainingDocs.map((docUrl, i) => (
            <div key={i} className="mb-2">
              <a
                href={docUrl}
                target="_blank"
                className="text-blue-600 underline"
              >
                {docUrl}
              </a>
            </div>
          ))}

        <input type="file" accept="application/pdf" onChange={handleTrainingUpload} />
      </section>

      {/* ========== AI NOTES ========== */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-2">AI Training Notes</h2>
        <textarea
          value={aiNotes}
          onChange={(e) => setAiNotes(e.target.value)}
          className="border w-full p-3 rounded h-32"
          placeholder="Extra knowledge your AI assistant should know..."
        />
      </section>

      {/* ========== SAVE BUTTON ========== */}
      <button
        onClick={saveDealerData}
        className="bg-green-600 text-white px-6 py-3 rounded text-xl"
      >
        Save Settings
      </button>
    </div>
  );
}
