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
      salesFiles.forEach((f) => form.append("files", f));

      const res = await fetch("/api/train/sales", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus(
        "Files uploaded successfully. Processing has started and may take several minutes."
      );
      setSalesFiles([]);
    } catch (err) {
      setStatus("Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  // 🔄 Poll ingest job status
  useEffect(() => {
    const loadStatus = async () => {
      const res = await fetch("/api/train/status");
      const data = await res.json();
      if (data.ok) setJobs(data.jobs);
    };

    loadStatus();
    const timer = setInterval(loadStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train Sales AI</h1>

      <div className="border rounded p-4 space-y-4">
        <input
          type="file"
          multiple
          onChange={(e) => setSalesFiles(Array.from(e.target.files))}
        />

        {salesFiles.length > 0 && (
          <div className="text-sm text-gray-600">
            {salesFiles.length} file(s) selected
          </div>
        )}

        <button
          type="button"
          onClick={uploadSalesFiles}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload Sales Files"}
        </button>

        {status && (
          <div className="text-sm text-gray-700 mt-2">
            {status}
            <div className="mt-2 text-xs text-gray-500">
              You can safely leave this page. Files are processed in the
              background.
            </div>
          </div>
        )}

        {/* 📊 Job Status */}
        {jobs.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Recent Training Jobs</h2>
            <ul className="space-y-1 text-sm">
              {jobs.map((j) => (
                <li key={j.id} className="flex justify-between">
                  <span className="truncate max-w-[70%]">
                    {j.original_name}
                  </span>
                  <span
                    className={
                      j.status === "complete"
                        ? "text-green-600"
                        : j.status === "failed"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }
                  >
                    {j.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
