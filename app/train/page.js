"use client";

import { useEffect, useMemo, useState } from "react";

export default function TrainPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [jobs, setJobs] = useState([]);

  const [tab, setTab] = useState("documents");

  const [brain, setBrain] = useState([]);
  const [search, setSearch] = useState("");
  const [stepFilter, setStepFilter] = useState("");

  /* ================= FILE UPLOAD ================= */

  async function uploadFiles() {
    if (!files.length) {
      alert("No files selected");
      return;
    }

    setLoading(true);
    setStatus("Uploading files…");

    try {
      for (const file of files) {
        const res = await fetch("/api/train/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        });

        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Upload init failed");

        const uploadRes = await fetch(data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": data.contentType },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("Direct upload failed");
        }
      }

      setStatus("Files uploaded. Processing in background.");
      setFiles([]);
      fetchStatus();
    } catch (err) {
      console.error(err);
      setStatus("Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  /* ================= STATUS ================= */

  async function fetchStatus() {
    const res = await fetch("/api/train/status", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setJobs(data.jobs);
  }

  async function fetchBrain() {
    const res = await fetch("/api/train/brain", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setBrain(data.items);
  }

  useEffect(() => {
    fetchStatus();
    fetchBrain();
    const id = setInterval(fetchStatus, 5000);
    return () => clearInterval(id);
  }, []);

  /* ================= FILTERING ================= */

  const filteredBrain = useMemo(() => {
    return brain.filter((b) => {
      if (search && !b.preview.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (stepFilter && String(b.step) !== stepFilter) {
        return false;
      }
      return true;
    });
  }, [brain, search, stepFilter]);

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train AI</h1>

      {/* ===== TABS ===== */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("documents")}
          className={`px-4 py-2 rounded ${
            tab === "documents"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Documents
        </button>

        <button
          onClick={() => setTab("chat")}
          className={`px-4 py-2 rounded ${
            tab === "chat" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Chat / Manual Training
        </button>
      </div>

      {/* ================= DOCUMENTS TAB ================= */}
      {tab === "documents" && (
        <>
          <div className="border rounded p-4 space-y-4 mb-8">
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />

            <button
              onClick={uploadFiles}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
            >
              {loading ? "Uploading…" : "Upload Files"}
            </button>

            {status && <div className="text-sm">{status}</div>}
          </div>

          <h2 className="text-xl font-semibold mb-2">Ingestion Status</h2>

          <div className="border rounded divide-y text-sm">
            {jobs.map((job) => (
              <div key={job.id} className="flex justify-between p-2">
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
        </>
      )}

      {/* ================= CHAT / MANUAL TAB ================= */}
      {tab === "chat" && (
        <>
          <div className="flex gap-4 mb-4">
            <input
              className="flex-1 border p-2 rounded"
              placeholder="Search training text…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border p-2 rounded"
              value={stepFilter}
              onChange={(e) => setStepFilter(e.target.value)}
            >
              <option value="">All Steps</option>
              {[1,2,3,4,5,6,7,8,9,10,11].map((s) => (
                <option key={s} value={s}>
                  Step {s}
                </option>
              ))}
            </select>
          </div>

          <div className="border rounded divide-y text-sm">
            {filteredBrain.map((b) => (
              <div key={b.source_file} className="p-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {b.is_chat ? "Human (Chat)" : "Uploaded File"} ·{" "}
                    {b.source_file}
                  </span>
                  <span>{new Date(b.created_at).toLocaleString()}</span>
                </div>

                {b.step && (
                  <div className="text-xs font-semibold text-blue-600">
                    F&I STEP {b.step}
                  </div>
                )}

                <div className="whitespace-pre-wrap">
                  {b.preview}
                  {b.preview.length >= 300 && "…"}
                </div>

                <div className="text-xs text-gray-500">
                  Chunks: {b.chunks}
                </div>
              </div>
            ))}

            {!filteredBrain.length && (
              <div className="p-3 text-gray-500">
                No chat/manual training found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
