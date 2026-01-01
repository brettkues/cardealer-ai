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

  /* ================= UPLOAD HELPERS ================= */

  async function upload(endpoint, label) {
    if (!files.length) {
      alert(`No ${label} selected`);
      return;
    }

    setLoading(true);
    setStatus(`Uploading ${label}…`);

    try {
      for (const file of files) {
        const res = await fetch(endpoint, {
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

      setFiles([]);
      setStatus(`${label} uploaded. Processing…`);
      fetchStatus();
    } catch (err) {
      console.error(err);
      setStatus(`${label} upload failed.`);
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

  const rateJobs = jobs.filter((j) => j.doc_type === "RATE_SHEET");

  /* ================= UI ================= */

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train AI</h1>

      {/* ===== TABS ===== */}
      <div className="flex gap-4 mb-6">
        {["documents", "rates", "chat"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t === "documents"
              ? "Documents"
              : t === "rates"
              ? "Rate Sheets"
              : "Chat / Manual Training"}
          </button>
        ))}
      </div>

      {/* ================= DOCUMENTS ================= */}
      {tab === "documents" && (
        <>
          <UploadBox
            onUpload={() => upload("/api/train/sales", "documents")}
            loading={loading}
            setFiles={setFiles}
            status={status}
            label="Upload Documents"
          />
          <IngestStatus jobs={jobs} />
        </>
      )}

      {/* ================= RATE SHEETS ================= */}
      {tab === "rates" && (
        <>
          <UploadBox
            onUpload={() => upload("/api/train/rates", "rate sheets")}
            loading={loading}
            setFiles={setFiles}
            status={status}
            label="Upload Rate Sheets"
          />

          <h2 className="text-xl font-semibold mb-2">
            Active & Superseded Rate Sheets
          </h2>

          <div className="border rounded divide-y text-sm">
            {rateJobs.map((j) => (
              <div key={j.id} className="p-2 flex justify-between">
                <span className="truncate">{j.original_name}</span>
                <span className="font-semibold">{j.status}</span>
              </div>
            ))}
            {!rateJobs.length && (
              <div className="p-2 text-gray-500">
                No rate sheets uploaded yet.
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= CHAT ================= */}
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
                <div className="text-xs text-gray-500">
                  {b.source_file}
                </div>
                {b.step && (
                  <div className="text-xs font-semibold text-blue-600">
                    F&I STEP {b.step}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{b.preview}</div>
                <div className="text-xs text-gray-500">
                  Chunks: {b.chunks}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function UploadBox({ onUpload, loading, setFiles, status, label }) {
  return (
    <div className="border rounded p-4 space-y-4 mb-8">
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      <button
        onClick={onUpload}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded disabled:opacity-50"
      >
        {loading ? "Uploading…" : label}
      </button>
      {status && <div className="text-sm">{status}</div>}
    </div>
  );
}

function IngestStatus({ jobs }) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Ingestion Status</h2>
      <div className="border rounded divide-y text-sm">
        {jobs.map((job) => (
          <div key={job.id} className="flex justify-between p-2">
            <span className="truncate max-w-[70%]">
              {job.original_name}
            </span>
            <span className="font-semibold">{job.status}</span>
          </div>
        ))}
        {!jobs.length && (
          <div className="p-2 text-gray-500">
            No ingestion jobs yet.
          </div>
        )}
      </div>
    </>
  );
}
