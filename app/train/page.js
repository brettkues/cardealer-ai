"use client";

import { useEffect, useState } from "react";

export default function TrainPage() {
  const [salesFiles, setSalesFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobs, setJobs] = useState([]);

  async function uploadSalesFiles() {
    if (!salesFiles.length) {
      alert("No files selected");
      return;
    }

    setLoading(true);
    setStatus("Uploading files…");

    try {
      const form = new FormData();
      salesFiles.forEach(f => form.append("files", f));

      await fetch("/api/train/sales", {
        method: "POST",
        body: form,
      });

      setStatus("Files uploaded. Processing in background.");
      setSalesFiles([]);
    } catch {
      setStatus("Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  // 🔁 Poll ingest status
  useEffect(() => {
    async function fetchStatus() {
      const res = await fetch("/api/train/status");
      const data = await res.json();
      if (data.ok) setJobs(data.jobs);
    }

    fetchStatus();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train Sales AI</h1>

      <div className="border rounded p-4 space-y-4">
        <input
          type="file"
          multiple
          onChange={(e) => setSalesFiles(Array.from(e.target.files))}
        />

        <button
          type="button"
          onClick={uploadSalesFiles}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload Sales Files"}
        </button>

        {status && <div className="text-sm text-gray-700">{status}</div>}
      </div>

      {/* 📊 STATUS PANEL */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Ingestion Status</h2>

        <div className="border rounded divide-y text-sm">
          {jobs.map(job => (
            <div
              key={job.id}
              className="flex justify-between p-2"
            >
              <span className="truncate max-w-[70%]">
                {job.original_name}
              </span>

              <span
                className={
                  job.status === "complete"
                    ? "text-green-600 font-semibold"
                    : job.status === "failed"
                    ? "text-red-600 font-semibold"
                    : "text-yellow-600 font-semibold"
                }
              >
                {job.status}
              </span>
            </div>
          ))}

          {!jobs.length && (
            <div className="p-2 text-gray-500">
              No ingestion jobs yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
