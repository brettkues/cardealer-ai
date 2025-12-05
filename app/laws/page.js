"use client";

import { useEffect, useState } from "react";

export default function LawsPage() {
  const [uid, setUid] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [state, setState] = useState("WI");
  const [file, setFile] = useState(null);
  const [textLaw, setTextLaw] = useState("");
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------------
  // 1. LOAD SESSION + SUBSCRIPTION
  // -----------------------------------
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();

      if (!data.loggedIn || !data.uid) {
        window.location.href = "/login";
        return;
      }

      setUid(data.uid);

      const subRes = await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ uid: data.uid }),
      });

      const subData = await subRes.json();

      if (!subData.active) {
        window.location.href = "/subscribe";
        return;
      }

      setSubscribed(true);
      setLoading(false);
      await loadDocs(data.uid);
    }

    load();
  }, []);

  // -----------------------------------
  // 2. LOAD USER DOCUMENTS
  // -----------------------------------
  async function loadDocs(uid) {
    const res = await fetch("/api/laws/get", {
      method: "POST",
      body: JSON.stringify({ uid }),
    });

    const data = await res.json();
    setUploaded(data.files || []);
  }

  // -----------------------------------
  // 3. UPLOAD PDF (server route)
  // -----------------------------------
  async function uploadPDF() {
    if (!file) return alert("Select a PDF");

    const form = new FormData();
    form.append("file", file);
    form.append("uid", uid);
    form.append("state", state);

    const res = await fetch("/api/laws/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Upload failed: " + data.error);
      return;
    }

    setFile(null);
    await loadDocs(uid);
    alert("Uploaded!");
  }

  // -----------------------------------
  // 4. SAVE TEXT LAW
  // -----------------------------------
  async function saveTextLaw() {
    if (!textLaw.trim()) return alert("Text is empty");

    const res = await fetch("/api/laws/text", {
      method: "POST",
      body: JSON.stringify({ uid, state, textLaw }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error saving: " + data.error);
      return;
    }

    setTextLaw("");
    alert("Saved!");
  }

  // -----------------------------------
  // 5. DELETE PDF
  // -----------------------------------
  async function deletePDF(item) {
    if (!confirm("Delete this file?")) return;

    const res = await fetch("/api/laws/delete", {
      method: "POST",
      body: JSON.stringify({
        id: item.id,
        storagePath: item.storagePath,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Delete error: " + data.error);
      return;
    }

    await loadDocs(uid);
  }

  // -----------------------------------
  // 6. UI LOADING SCREEN
  // -----------------------------------
  if (loading || !subscribed) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking access…
      </div>
    );
  }

  // -----------------------------------
  // 7. RENDER PAGE
  // -----------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Advertising Law Library</h1>

      <label className="block mb-3 text-gray-300 font-semibold">
        Select State
      </label>

      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="w-full bg-gray-700 text-white p-3 rounded-lg mb-6"
      >
        <option value="WI">Wisconsin (WI)</option>
        <option value="OTHER">Other State</option>
      </select>

      {/* Upload PDF */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="text-gray-300 mb-4"
        />
        <button
          onClick={uploadPDF}
          disabled={!file}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
        >
          Upload PDF
        </button>
      </div>

      {/* Text law entry */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4">Enter Text Law</h2>
        <textarea
          value={textLaw}
          onChange={(e) => setTextLaw(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 h-48 rounded-lg border border-gray-600"
        />
        <button
          onClick={saveTextLaw}
          className="w-full py-3 mt-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold"
        >
          Save Text Law
        </button>
      </div>

      {/* Uploaded PDFs */}
      <h2 className="text-xl font-semibold mb-4">Your Uploaded PDFs</h2>

      {uploaded.length === 0 ? (
        <p className="text-gray-400">No PDFs uploaded.</p>
      ) : (
        <div className="space-y-4">
          {uploaded.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-800 rounded-xl border border-gray-700 flex justify-between"
            >
              <div>
                <p className="font-semibold">{item.filename}</p>
                <p className="text-gray-400 text-sm">State: {item.state}</p>
              </div>

              <div className="flex gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm"
                >
                  View
                </a>
                <button
                  onClick={() => deletePDF(item)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
