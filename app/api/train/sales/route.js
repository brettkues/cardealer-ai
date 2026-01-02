"use client";

import { useEffect, useState } from "react";

export default function TrainPage() {
  const [files, setFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("documents");

  async function uploadSigned(label) {
    if (!files.length) return;

    setLoading(true);
    setStatus(`Uploading ${label}…`);

    try {
      for (const file of files) {
        const init = await fetch("/api/train/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        });
        const initData = await init.json();
        if (!init.ok || !initData.ok) throw new Error();

        const put = await fetch(initData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": initData.contentType },
          body: file,
        });
        if (!put.ok) throw new Error();

        const fin = await fetch("/api/train/sales/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath: initData.filePath,
            original_name: file.name,
          }),
        });
        if (!fin.ok) throw new Error();
      }

      setFiles([]);
      setStatus(`${label} uploaded`);
      fetchStatus();
    } catch {
      setStatus(`${label} upload failed`);
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train AI</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("documents")}
          className={`px-4 py-2 rounded border ${
            tab === "documents" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setTab("rates")}
          className={`px-4 py-2 rounded border ${
            tab === "rates" ? "bg-green-700 text-white" : "bg-gray-100"
          }`}
        >
          Rate Sheets
        </button>
      </div>

      {tab === "documents" && (
        <div className="space-y-4">
          <input type="file" multiple onChange={e => setFiles([...e.target.files])} />
          <button
            disabled={loading}
            onClick={() => uploadSigned("documents")}
            className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Upload Documents
          </button>
          {status && <div className="text-sm">{status}</div>}
        </div>
      )}

      {tab === "rates" && (
        <div className="space-y-4">
          <input type="file" multiple onChange={e => setFiles([...e.target.files])} />
          <button
            disabled={loading}
            onClick={() => uploadSigned("rate sheets")}
            className="px-6 py-3 bg-green-700 text-white rounded disabled:opacity-50"
          >
            Upload Rate Sheets
          </button>
          {status && <div className="text-sm">{status}</div>}
        </div>
      )}

      <h2 className="mt-8 font-semibold">Ingestion Status</h2>
      <div className="mt-2 text-sm space-y-1">
        {jobs.map(j => (
          <div key={j.id}>
            {j.original_name} — {j.status}
          </div>
        ))}
      </div>
    </div>
  );
}
