"use client";

import { useEffect, useState } from "react";

export default function TrainPage() {
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("documents");

  /* ================= UPLOAD ================= */

  async function upload(endpoint, label) {
    if (!files.length) {
      alert(`No ${label} selected`);
      return;
    }

    setLoading(true);
    setStatus(`Uploading ${label}…`);

    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    const res = await fetch(endpoint, {
      method: "POST",
      body: form,
    });

    let data;
    try {
      data = await res.json();
    } catch {
      setLoading(false);
      setStatus(`${label} upload failed (server error)`);
      return;
    }

    setLoading(false);

    if (!res.ok || !data.ok) {
      setStatus(`${label} upload failed`);
      return;
    }

    setFiles([]);
    setStatus(`${label} uploaded successfully`);
    fetchStatus();
  }

  /* ================= STATUS ================= */

  async function fetchStatus() {
    const res = await fetch("/api/train/status", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setJobs(data.jobs);
  }

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, []);

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train AI</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("documents")}
          className={`px-4 py-2 rounded border ${
            tab === "documents"
              ? "bg-blue-600 text-white"
              : "bg-green-100 hover:bg-green-200"
          }`}
        >
          Documents
        </button>

        <button
          onClick={() => setTab("rates")}
          className={`px-4 py-2 rounded border ${
            tab === "rates"
              ? "bg-green-600 text-white"
              : "bg-green-100 hover:bg-green-200"
          }`}
        >
          Rate Sheets
        </button>
      </div>

      {/* Documents */}
      {tab === "documents" && (
        <div className="space-y-4">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
          />

          <button
            onClick={() => upload("/api/train/sales", "documents")}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Upload Documents"}
          </button>

          {status && <div className="text-sm">{status}</div>}
        </div>
      )}

      {/* Rate Sheets */}
      {tab === "rates" && (
        <div className="space-y-4">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles([...e.target.files])}
          />

          <button
            onClick={() => upload("/api/train/rates", "rate sheets")}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Upload Rate Sheets"}
          </button>

          {status && <div className="text-sm">{status}</div>}
        </div>
      )}

      {/* Status */}
      <h2 className="mt-8 font-semibold">Ingestion Status</h2>
      <div className="mt-2 space-y-1 text-sm">
        {jobs.map((j) => (
          <div key={j.id}>
            {j.original_name} —{" "}
            <span
              className={
                j.status === "complete"
                  ? "text-green-600"
                  : j.status === "failed"
                  ? "text-red-600"
                  : j.status === "superseded"
                  ? "text-green-400"
                  : "text-yellow-600"
              }
            >
              {j.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
