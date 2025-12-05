"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------
// CLIENT PAGE (no Firebase initialization)
// All Firebase calls go through API routes.
// ---------------------------------------------------

export default function LawsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState(null);
  const [state, setState] = useState("WI");
  const [file, setFile] = useState(null);
  const [textLaw, setTextLaw] = useState("");
  const [uploaded, setUploaded] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------
  // Verify login + subscription via server
  // ---------------------------------------------------
  useEffect(() => {
    async function verify() {
      const res = await fetch("/api/session/me", { method: "GET" });
      const data = await res.json();

      if (!data.uid) {
        router.push("/login");
        return;
      }

      const subRes = await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ uid: data.uid }),
      });
      const sub = await subRes.json();

      if (!sub.active) {
        router.push("/subscribe");
        return;
      }

      setUid(data.uid);
      setChecking(false);
    }

    verify();
  }, [router]);

  if (checking) {
    return (
      <div className="h-screen bg-gray-900 text-white flex justify-center items-center">
        Checking access…
      </div>
    );
  }

  // ---------------------------------------------------
  // LOAD PDF LIST
  // ---------------------------------------------------
  const loadDocs = async () => {
    const res = await fetch(`/api/laws/list?uid=${uid}`);
    const data = await res.json();
    setUploaded(data.files || []);
  };

  useEffect(() => {
    if (uid) loadDocs();
  }, [uid]);

  // ---------------------------------------------------
  // UPLOAD PDF
  // ---------------------------------------------------
  const uploadPDF = async () => {
    if (!file) return alert("Choose a PDF");

    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("uid", uid);
      form.append("state", state);

      const res = await fetch("/api/laws/upload", {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      await loadDocs();
      setFile(null);
      alert("PDF uploaded!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }

    setLoading(false);
  };

  // ---------------------------------------------------
  // SAVE TEXT LAW
  // ---------------------------------------------------
  const saveTextLaw = async () => {
    if (!textLaw.trim()) return;

    await fetch("/api/laws/text", {
      method: "POST",
      body: JSON.stringify({
        uid,
        state,
        text: textLaw.trim(),
      }),
    });

    setTextLaw("");
    alert("Text saved!");
  };

  // ---------------------------------------------------
  // DELETE PDF
  // ---------------------------------------------------
  const deletePDF = async (file) => {
    if (!confirm("Delete this file?")) return;

    await fetch("/api/laws/delete", {
      method: "POST",
      body: JSON.stringify({
        id: file.id,
        storagePath: file.storagePath,
      }),
    });

    await loadDocs();
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Advertising Law Library</h1>

      <label className="font-semibold">Select State</label>
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        className="w-full bg-gray-700 p-3 rounded mt-2 mb-6"
      >
        <option value="WI">Wisconsin (WI)</option>
        <option value="OTHER">Other State</option>
      </select>

      {/* Upload PDF */}
      <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold mb-3">Upload PDF</h2>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4"
        />
        <button
          onClick={uploadPDF}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg"
        >
          {loading ? "Uploading…" : "Upload PDF"}
        </button>
      </div>

      {/* Text laws */}
      <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold mb-3">Paste Law Text</h2>
        <textarea
          value={textLaw}
          onChange={(e) => setTextLaw(e.target.value)}
          className="w-full h-48 bg-gray-700 p-3 rounded-lg"
        />
        <button
          onClick={saveTextLaw}
          className="w-full py-3 mt-3 bg-green-600 hover:bg-green-500 rounded-lg"
        >
          Save Text
        </button>
      </div>

      {/* Existing files */}
      <h2 className="text-xl font-semibold mb-4">Your Uploaded PDFs</h2>
      {uploaded.length === 0 ? (
        <p className="text-gray-400">No files yet.</p>
      ) : (
        <div className="space-y-4">
          {uploaded.map((file) => (
            <div
              key={file.id}
              className="p-4 bg-gray-800 border border-gray-700 rounded-xl flex justify-between"
            >
              <div>
                <p className="font-semibold">{file.filename}</p>
                <p className="text-gray-400 text-sm">State: {file.state}</p>
              </div>

              <div className="flex gap-3">
                <a
                  href={file.url}
                  target="_blank"
                  className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded"
                >
                  View
                </a>
                <button
                  onClick={() => deletePDF(file)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded"
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
